#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'

interface SecurityIssue {
  table: string
  issue: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  description: string
  remediation: string
}

class DatabaseSecurityChecker {
  private supabase: any
  private issues: SecurityIssue[] = []

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }

    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  async checkRLSStatus(): Promise<void> {
    try {
      // Check RLS status on critical tables
      const criticalTables = ['users', 'listings', 'favourites', 'threads', 'messages']
      
      for (const tableName of criticalTables) {
        const { data, error } = await this.supabase
          .rpc('check_rls_status', { table_name: tableName })
        
        if (error) {
          console.warn(`Could not check RLS status for ${tableName}:`, error.message)
          continue
        }

        if (!data || !data.rls_enabled) {
          this.issues.push({
            table: tableName,
            issue: 'RLS_DISABLED',
            severity: 'CRITICAL',
            description: `Row Level Security is not enabled on table ${tableName}`,
            remediation: `Run: ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;`
          })
        }
      }
    } catch (error) {
      console.warn('RLS check failed:', error)
    }
  }

  async checkTablePermissions(): Promise<void> {
    try {
      // Check for overly permissive public access
      const publicTables = ['spatial_ref_sys']
      
      for (const tableName of publicTables) {
        // Check if table allows public access without restrictions
        const { data, error } = await this.supabase
          .from(tableName)
          .select('*', { count: 'exact' })
        
        if (!error && data) {
          this.issues.push({
            table: tableName,
            issue: 'UNRESTRICTED_PUBLIC_ACCESS',
            severity: 'MEDIUM',
            description: `Table ${tableName} allows unrestricted public access`,
            remediation: 'Consider restricting access through schema permissions'
          })
        }
      }
    } catch (error) {
      console.warn('Permission check failed:', error)
    }
  }

  async checkDataIntegrity(): Promise<void> {
    try {
      // Check for users without proper constraints
      const { data: usersWithoutEmail, error } = await this.supabase
        .from('users')
        .select('id')
        .is('email', null)

      if (!error && usersWithoutEmail && usersWithoutEmail.length > 0) {
        this.issues.push({
          table: 'users',
          issue: 'MISSING_EMAIL_CONSTRAINT',
          severity: 'HIGH',
          description: `${usersWithoutEmail.length} users found without email addresses`,
          remediation: 'Add NOT NULL constraint on email field'
        })
      }

      // Check for orphaned listings
      const { data: orphanedListings, error: listingsError } = await this.supabase
        .from('listings')
        .select('id, owner_id')
        .not('owner_id', 'in', '(SELECT id FROM users)')

      if (!listingsError && orphanedListings && orphanedListings.length > 0) {
        this.issues.push({
          table: 'listings',
          issue: 'ORPHANED_RECORDS',
          severity: 'MEDIUM',
          description: `${orphanedListings.length} listings found with non-existent owners`,
          remediation: 'Clean up orphaned records and add foreign key constraints'
        })
      }
    } catch (error) {
      console.warn('Data integrity check failed:', error)
    }
  }

  private generateReport(): void {
    console.log('\n🔐 DATABASE SECURITY REPORT')
    console.log('=' .repeat(50))

    if (this.issues.length === 0) {
      console.log('✅ No security issues found!')
      return
    }

    const severityCounts = {
      CRITICAL: this.issues.filter(i => i.severity === 'CRITICAL').length,
      HIGH: this.issues.filter(i => i.severity === 'HIGH').length,
      MEDIUM: this.issues.filter(i => i.severity === 'MEDIUM').length,
      LOW: this.issues.filter(i => i.severity === 'LOW').length,
    }

    console.log(`\n📊 Issues Summary:`)
    console.log(`🔴 Critical: ${severityCounts.CRITICAL}`)
    console.log(`🟠 High: ${severityCounts.HIGH}`)
    console.log(`🟡 Medium: ${severityCounts.MEDIUM}`)
    console.log(`🔵 Low: ${severityCounts.LOW}`)

    console.log('\n🐛 Detailed Issues:')
    this.issues
      .sort((a, b) => {
        const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
        return severityOrder[a.severity] - severityOrder[b.severity]
      })
      .forEach((issue, index) => {
        const icon = issue.severity === 'CRITICAL' ? '🔴' : 
                     issue.severity === 'HIGH' ? '🟠' : 
                     issue.severity === 'MEDIUM' ? '🟡' : '🔵'
        
        console.log(`\n${index + 1}. ${icon} ${issue.severity}: ${issue.table}`)
        console.log(`   Issue: ${issue.issue}`)
        console.log(`   Description: ${issue.description}`)
        console.log(`   Remediation: ${issue.remediation}`)
      })

    console.log('\n💡 Recommendations:')
    if (severityCounts.CRITICAL > 0) {
      console.log('  • Apply the RLS migration immediately: supabase/migrations/fix_rls_security.sql')
      console.log('  • Critical security issues must be resolved before production deployment')
    }
    if (severityCounts.HIGH > 0) {
      console.log('  • Review and resolve high-severity issues as soon as possible')
    }
    if (severityCounts.MEDIUM + severityCounts.LOW > 0) {
      console.log('  • Schedule time to address medium and low severity issues')
    }

    console.log('\n🚀 Next Steps:')
    console.log('  1. Apply database migrations: npx supabase db push')
    console.log('  2. Run this check again to verify fixes')
    console.log('  3. Set up regular security monitoring')
  }

  async run(): Promise<void> {
    console.log('🔍 Starting database security check...\n')

    await this.checkRLSStatus()
    await this.checkTablePermissions()
    await this.checkDataIntegrity()

    this.generateReport()

    // Exit with error code if critical issues found
    const criticalIssues = this.issues.filter(i => i.severity === 'CRITICAL').length
    if (criticalIssues > 0) {
      console.log(`\n❌ ${criticalIssues} critical security issues found!`)
      process.exit(1)
    } else {
      console.log('\n✅ No critical security issues detected.')
    }
  }
}

// SQL function to create for RLS checking (run this in Supabase SQL editor)
const createRLSCheckFunction = `
CREATE OR REPLACE FUNCTION check_rls_status(table_name text)
RETURNS TABLE(rls_enabled boolean) AS $$
BEGIN
    RETURN QUERY
    SELECT c.relrowsecurity as rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE c.relname = table_name
    AND n.nspname = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`

// Export the function creation SQL for reference
console.log('💡 To enable full security checking, run this in your Supabase SQL editor:')
console.log(createRLSCheckFunction)

// Run the security check
if (require.main === module) {
  const checker = new DatabaseSecurityChecker()
  checker.run().catch(error => {
    console.error('💥 Database security check failed:', error)
    process.exit(1)
  })
}

export { DatabaseSecurityChecker }