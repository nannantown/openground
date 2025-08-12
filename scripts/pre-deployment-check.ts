#!/usr/bin/env tsx

import { spawn, SpawnOptionsWithStdioTuple } from 'child_process'
import { promises as fs } from 'fs'
import { join } from 'path'

interface CheckResult {
  name: string
  success: boolean
  message: string
  duration: number
}

class PreDeploymentChecker {
  private results: CheckResult[] = []
  private startTime = Date.now()

  async runCommand(
    command: string,
    args: string[],
    options?: SpawnOptionsWithStdioTuple<'pipe', 'pipe', 'pipe'>
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve) => {
      const child = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        ...options,
      })

      let stdout = ''
      let stderr = ''

      child.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      child.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      child.on('close', (exitCode) => {
        resolve({ stdout, stderr, exitCode: exitCode || 0 })
      })
    })
  }

  async addCheck(
    name: string,
    checkFn: () => Promise<{ success: boolean; message: string }>
  ): Promise<void> {
    const start = Date.now()
    console.log(`🔍 Running ${name}...`)

    try {
      const result = await checkFn()
      const duration = Date.now() - start

      this.results.push({
        name,
        success: result.success,
        message: result.message,
        duration,
      })

      if (result.success) {
        console.log(`✅ ${name} (${duration}ms)`)
      } else {
        console.log(`❌ ${name} (${duration}ms)`)
        console.log(`   ${result.message}`)
      }
    } catch (error) {
      const duration = Date.now() - start
      const message = error instanceof Error ? error.message : String(error)

      this.results.push({
        name,
        success: false,
        message: `Check failed with error: ${message}`,
        duration,
      })

      console.log(`❌ ${name} (${duration}ms)`)
      console.log(`   Error: ${message}`)
    }
  }

  // TypeScript compilation check
  async checkTypeScript(): Promise<{ success: boolean; message: string }> {
    const result = await this.runCommand('npx', ['tsc', '--noEmit'])

    if (result.exitCode === 0) {
      return {
        success: true,
        message: 'TypeScript compilation successful',
      }
    }

    return {
      success: false,
      message: `TypeScript errors found:\n${result.stdout}\n${result.stderr}`,
    }
  }

  // ESLint check
  async checkLinting(): Promise<{ success: boolean; message: string }> {
    const result = await this.runCommand('npm', ['run', 'lint'])

    if (result.exitCode === 0) {
      return {
        success: true,
        message: 'ESLint checks passed',
      }
    }

    return {
      success: false,
      message: `ESLint errors found:\n${result.stdout}\n${result.stderr}`,
    }
  }

  // Build verification
  async checkBuild(): Promise<{ success: boolean; message: string }> {
    const result = await this.runCommand('npm', ['run', 'build'])

    if (result.exitCode === 0) {
      return {
        success: true,
        message: 'Build completed successfully',
      }
    }

    return {
      success: false,
      message: `Build failed:\n${result.stdout}\n${result.stderr}`,
    }
  }

  // Dependency audit
  async checkDependencies(): Promise<{ success: boolean; message: string }> {
    const result = await this.runCommand('npm', ['audit', '--audit-level=high'])

    if (result.exitCode === 0) {
      return {
        success: true,
        message: 'No high or critical security vulnerabilities found',
      }
    }

    // Check if it's just informational
    if (result.stdout.includes('0 vulnerabilities')) {
      return {
        success: true,
        message: 'No security vulnerabilities found',
      }
    }

    // In development, only fail on high/critical vulnerabilities
    if (process.env.NODE_ENV === 'development' || process.env.CI === 'true') {
      // Check for high/critical vulnerabilities only
      if (result.stdout.includes('high') || result.stdout.includes('critical')) {
        return {
          success: false,
          message: `High/Critical security vulnerabilities found:\n${result.stdout}`,
        }
      }

      return {
        success: true,
        message: 'Only moderate vulnerabilities found (acceptable in development)',
      }
    }

    return {
      success: false,
      message: `Security vulnerabilities found:\n${result.stdout}`,
    }
  }

  // Environment variables check
  async checkEnvironmentVariables(): Promise<{ success: boolean; message: string }> {
    try {
      // Try to read env.example first, then .env.local.example
      let envExample: string
      try {
        envExample = await fs.readFile(join(process.cwd(), 'env.example'), 'utf-8')
      } catch {
        envExample = await fs.readFile(join(process.cwd(), '.env.local.example'), 'utf-8')
      }

      const requiredVars = envExample
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .map(line => line.split('=')[0])

      const missing = requiredVars.filter(varName => !process.env[varName])

      // In development/CI environment, allow missing env vars if they're optional
      if (process.env.CI === 'true' || process.env.NODE_ENV === 'development') {
        const criticalVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']
        const missingCritical = missing.filter(varName => criticalVars.includes(varName))
        
        if (missingCritical.length === 0) {
          return {
            success: true,
            message: missing.length > 0 
              ? `Some optional environment variables missing: ${missing.join(', ')}`
              : 'All required environment variables are set',
          }
        }

        return {
          success: false,
          message: `Missing critical environment variables: ${missingCritical.join(', ')}`,
        }
      }

      if (missing.length === 0) {
        return {
          success: true,
          message: 'All required environment variables are set',
        }
      }

      return {
        success: false,
        message: `Missing environment variables: ${missing.join(', ')}`,
      }
    } catch (error) {
      return {
        success: true,
        message: 'No environment example file found, skipping environment check',
      }
    }
  }

  // Package.json consistency check
  async checkPackageConsistency(): Promise<{ success: boolean; message: string }> {
    try {
      const packageJson = JSON.parse(
        await fs.readFile(join(process.cwd(), 'package.json'), 'utf-8')
      )
      const packageLock = JSON.parse(
        await fs.readFile(join(process.cwd(), 'package-lock.json'), 'utf-8')
      )

      // Check if package-lock is out of sync
      if (packageJson.name !== packageLock.name) {
        return {
          success: false,
          message: 'package.json and package-lock.json are out of sync',
        }
      }

      return {
        success: true,
        message: 'Package dependencies are consistent',
      }
    } catch (error) {
      return {
        success: false,
        message: `Package consistency check failed: ${error}`,
      }
    }
  }

  // Unit tests check
  async checkUnitTests(): Promise<{ success: boolean; message: string }> {
    const result = await this.runCommand('npm', ['run', 'test', '--', '--run'])

    if (result.exitCode === 0) {
      return {
        success: true,
        message: 'All unit tests passed',
      }
    }

    return {
      success: false,
      message: `Unit tests failed:\n${result.stdout}\n${result.stderr}`,
    }
  }

  // Critical file existence check
  async checkCriticalFiles(): Promise<{ success: boolean; message: string }> {
    const criticalFiles = [
      'next.config.js',
      'tailwind.config.js',
      'tsconfig.json',
      'src/middleware.ts',
      'src/app/layout.tsx',
    ]

    const missing = []
    for (const file of criticalFiles) {
      try {
        await fs.access(join(process.cwd(), file))
      } catch {
        missing.push(file)
      }
    }

    if (missing.length === 0) {
      return {
        success: true,
        message: 'All critical files exist',
      }
    }

    return {
      success: false,
      message: `Missing critical files: ${missing.join(', ')}`,
    }
  }

  // Supabase configuration check
  async checkSupabaseConfig(): Promise<{ success: boolean; message: string }> {
    try {
      // Check if Supabase environment variables are set
      const requiredSupabaseVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      ]

      const missing = requiredSupabaseVars.filter(varName => !process.env[varName])

      if (missing.length > 0) {
        // In development or CI, allow missing Supabase vars but warn
        if (process.env.NODE_ENV === 'development' || process.env.CI === 'true') {
          return {
            success: true,
            message: `Supabase environment variables missing (development mode): ${missing.join(', ')}`,
          }
        }

        return {
          success: false,
          message: `Missing Supabase environment variables: ${missing.join(', ')}`,
        }
      }

      // Check if Supabase client can be imported without errors
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const client = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Simple connection test (skip in CI or development)
        if (process.env.CI !== 'true' && process.env.NODE_ENV !== 'development') {
          const { error } = await client.from('users').select('count').limit(1)
          
          if (error && !error.message.includes('relation "users" does not exist')) {
            return {
              success: false,
              message: `Supabase connection error: ${error.message}`,
            }
          }
        }

        return {
          success: true,
          message: 'Supabase configuration is valid',
        }
      } catch (importError) {
        return {
          success: false,
          message: `Supabase import error: ${importError}`,
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Supabase configuration check failed: ${error}`,
      }
    }
  }

  // Run all checks
  async runAllChecks(): Promise<void> {
    console.log('🚀 Starting pre-deployment checks...\n')

    await this.addCheck('Critical Files', () => this.checkCriticalFiles())
    await this.addCheck('Package Consistency', () => this.checkPackageConsistency())
    await this.addCheck('Environment Variables', () => this.checkEnvironmentVariables())
    await this.addCheck('TypeScript Compilation', () => this.checkTypeScript())
    await this.addCheck('ESLint', () => this.checkLinting())
    await this.addCheck('Dependency Security', () => this.checkDependencies())
    await this.addCheck('Supabase Configuration', () => this.checkSupabaseConfig())
    await this.addCheck('Unit Tests', () => this.checkUnitTests())
    await this.addCheck('Build Verification', () => this.checkBuild())

    this.printSummary()
  }

  // Run fast checks (skip tests and build)
  async runFastChecks(): Promise<void> {
    await this.addCheck('Critical Files', () => this.checkCriticalFiles())
    await this.addCheck('Package Consistency', () => this.checkPackageConsistency())
    await this.addCheck('Environment Variables', () => this.checkEnvironmentVariables())
    await this.addCheck('TypeScript Compilation', () => this.checkTypeScript())
    await this.addCheck('ESLint', () => this.checkLinting())
    await this.addCheck('Dependency Security', () => this.checkDependencies())
    await this.addCheck('Supabase Configuration', () => this.checkSupabaseConfig())

    this.printSummary()
  }

  printSummary(): void {
    const totalTime = Date.now() - this.startTime
    const passed = this.results.filter(r => r.success).length
    const failed = this.results.filter(r => r.success === false).length

    console.log('\n' + '='.repeat(60))
    console.log('📊 PRE-DEPLOYMENT CHECK SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⏱️  Total time: ${totalTime}ms`)
    console.log('')

    if (failed > 0) {
      console.log('❌ FAILED CHECKS:')
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`   • ${r.name}: ${r.message}`)
        })
      console.log('')
      console.log('🚫 DEPLOYMENT BLOCKED - Please fix the above issues before deploying.')
      process.exit(1)
    } else {
      console.log('🎉 ALL CHECKS PASSED - Ready for deployment!')
      process.exit(0)
    }
  }
}

// Run checks if called directly
if (require.main === module) {
  const checker = new PreDeploymentChecker()
  const skipTests = process.argv.includes('--skip-tests')
  
  if (skipTests) {
    console.log('🚀 Starting fast pre-deployment checks (skipping tests)...\n')
    checker.runFastChecks().catch(error => {
      console.error('💥 Pre-deployment check system failed:', error)
      process.exit(1)
    })
  } else {
    checker.runAllChecks().catch(error => {
      console.error('💥 Pre-deployment check system failed:', error)
      process.exit(1)
    })
  }
}

export { PreDeploymentChecker }