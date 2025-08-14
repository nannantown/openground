import { test, expect } from '@playwright/test'

test.describe('Enhanced Messaging System', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('**/api/v1/auth/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user-id',
            display_name: 'Test User',
            avatar_url: null
          }
        })
      })
    })
  })

  test('should display thread list with unread counts', async ({ page }) => {
    const mockThreads = [
      {
        id: 'thread-1',
        listing_id: 'listing-1',
        last_message: 'Hello, is this still available?',
        updated_at: '2024-01-01T12:00:00Z',
        unread_count: 2,
        listing: {
          id: 'listing-1',
          title: 'Test Product',
          price: 5000,
          images: ['test-image.jpg'],
          owner_id: 'owner-1'
        },
        participants: [
          {
            user: {
              id: 'test-user-id',
              display_name: 'Test User',
              avatar_url: null
            }
          },
          {
            user: {
              id: 'other-user-id',
              display_name: 'Other User',
              avatar_url: null
            }
          }
        ]
      }
    ]

    // Mock threads API
    await page.route('**/api/v1/threads', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockThreads)
      })
    })

    await page.goto('/messages')

    // Check thread list displays
    await expect(page.locator('[data-testid="thread-list"]')).toBeVisible()
    await expect(page.locator('[data-testid="thread-thread-1"]')).toBeVisible()
    
    // Check unread badge
    await expect(page.locator('[data-testid="unread-badge"]')).toBeVisible()
    await expect(page.locator('[data-testid="unread-badge"]')).toHaveText('2')
    
    // Check thread content
    await expect(page.locator('text=Other User')).toBeVisible()
    await expect(page.locator('text=Test Product')).toBeVisible()
    await expect(page.locator('text=Hello, is this still available?')).toBeVisible()
  })

  test('should filter threads by search query', async ({ page }) => {
    const mockThreads = [
      {
        id: 'thread-1',
        listing_id: 'listing-1',
        last_message: 'Hello about the car',
        updated_at: '2024-01-01T12:00:00Z',
        unread_count: 0,
        listing: {
          id: 'listing-1',
          title: 'Used Car',
          price: 50000,
          images: [],
          owner_id: 'owner-1'
        },
        participants: [
          {
            user: {
              id: 'test-user-id',
              display_name: 'Test User',
              avatar_url: null
            }
          },
          {
            user: {
              id: 'other-user-id',
              display_name: 'John Doe',
              avatar_url: null
            }
          }
        ]
      },
      {
        id: 'thread-2',
        listing_id: 'listing-2',
        last_message: 'Is the bike available?',
        updated_at: '2024-01-01T12:00:00Z',
        unread_count: 1,
        listing: {
          id: 'listing-2',
          title: 'Mountain Bike',
          price: 15000,
          images: [],
          owner_id: 'owner-2'
        },
        participants: [
          {
            user: {
              id: 'test-user-id',
              display_name: 'Test User',
              avatar_url: null
            }
          },
          {
            user: {
              id: 'another-user-id',
              display_name: 'Jane Smith',
              avatar_url: null
            }
          }
        ]
      }
    ]

    await page.route('**/api/v1/threads', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockThreads)
      })
    })

    await page.goto('/messages')
    
    // Search for "car"
    await page.locator('[data-testid="search-input"]').fill('car')
    
    // Should show only car-related thread
    await expect(page.locator('[data-testid="thread-thread-1"]')).toBeVisible()
    await expect(page.locator('[data-testid="thread-thread-2"]')).not.toBeVisible()
    await expect(page.locator('text=Used Car')).toBeVisible()
    
    // Clear search
    await page.locator('[data-testid="search-input"]').fill('')
    
    // Should show all threads
    await expect(page.locator('[data-testid="thread-thread-1"]')).toBeVisible()
    await expect(page.locator('[data-testid="thread-thread-2"]')).toBeVisible()
  })

  test('should send text message in chat', async ({ page }) => {
    const mockThread = {
      id: 'thread-1',
      listing_id: 'listing-1',
      last_message: 'Hello',
      updated_at: '2024-01-01T12:00:00Z',
      unread_count: 0,
      listing: {
        id: 'listing-1',
        title: 'Test Product',
        price: 5000,
        images: ['test-image.jpg'],
        owner_id: 'owner-1'
      },
      participants: [
        {
          user: {
            id: 'test-user-id',
            display_name: 'Test User',
            avatar_url: null
          }
        },
        {
          user: {
            id: 'other-user-id',
            display_name: 'Other User',
            avatar_url: null
          }
        }
      ]
    }

    const mockMessages = [
      {
        id: 'msg-1',
        thread_id: 'thread-1',
        sender_id: 'other-user-id',
        body: 'Hello, is this available?',
        image_urls: [],
        created_at: '2024-01-01T12:00:00Z',
        read_by: ['other-user-id'],
        sender: {
          id: 'other-user-id',
          display_name: 'Other User',
          avatar_url: null
        }
      }
    ]

    // Mock APIs
    await page.route('**/api/v1/threads', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockThread])
      })
    })

    await page.route('**/api/v1/threads/thread-1/messages', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockMessages)
        })
      } else if (route.request().method() === 'POST') {
        const postData = route.request().postDataJSON()
        const newMessage = {
          id: 'msg-2',
          thread_id: 'thread-1',
          sender_id: 'test-user-id',
          body: postData.message,
          image_urls: postData.image_urls || [],
          created_at: new Date().toISOString(),
          read_by: ['test-user-id'],
          sender: {
            id: 'test-user-id',
            display_name: 'Test User',
            avatar_url: null
          }
        }
        
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newMessage)
        })
      }
    })

    await page.route('**/api/v1/threads/thread-1/read', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    await page.goto('/messages/thread-1')
    
    // Check existing message
    await expect(page.locator('text=Hello, is this available?')).toBeVisible()
    
    // Send new message
    await page.locator('[data-testid="message-input"]').fill('Yes, it is still available!')
    await page.locator('[data-testid="send-message-button"]').click()
    
    // Check input is cleared
    await expect(page.locator('[data-testid="message-input"]')).toHaveValue('')
  })

  test('should handle image upload interface', async ({ page }) => {
    const mockThread = {
      id: 'thread-1',
      listing: { title: 'Test Product', price: 5000, images: [], owner_id: 'owner-1' },
      participants: [
        { user: { id: 'test-user-id', display_name: 'Test User', avatar_url: null } },
        { user: { id: 'other-user-id', display_name: 'Other User', avatar_url: null } }
      ]
    }

    await page.route('**/api/v1/threads', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockThread])
      })
    })

    await page.route('**/api/v1/threads/thread-1/messages', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      })
    })

    await page.route('**/api/v1/threads/thread-1/read', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    await page.goto('/messages/thread-1')
    
    // Check image upload button exists
    await expect(page.locator('[data-testid="image-upload-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="image-upload-button"]')).toHaveText('画像を添付')
  })

  test('should handle message deletion', async ({ page }) => {
    const mockThread = {
      id: 'thread-1',
      listing_id: 'listing-1',
      last_message: 'Hello',
      updated_at: '2024-01-01T12:00:00Z',
      unread_count: 0,
      listing: {
        id: 'listing-1',
        title: 'Test Product',
        price: 5000,
        images: [],
        owner_id: 'owner-1'
      },
      participants: [
        {
          user: {
            id: 'test-user-id',
            display_name: 'Test User',
            avatar_url: null
          }
        },
        {
          user: {
            id: 'other-user-id',
            display_name: 'Other User',
            avatar_url: null
          }
        }
      ]
    }

    const mockMessages = [
      {
        id: 'msg-1',
        thread_id: 'thread-1',
        sender_id: 'test-user-id',
        body: 'This message will be deleted',
        image_urls: [],
        created_at: '2024-01-01T12:00:00Z',
        read_by: ['test-user-id'],
        sender: {
          id: 'test-user-id',
          display_name: 'Test User',
          avatar_url: null
        }
      }
    ]

    // Mock APIs
    await page.route('**/api/v1/threads', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockThread])
      })
    })

    await page.route('**/api/v1/threads/thread-1/messages', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockMessages)
      })
    })

    await page.route('**/api/v1/threads/thread-1/read', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    await page.route('**/api/v1/messages/msg-1', (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    await page.goto('/messages/thread-1')
    
    // Check message exists
    await expect(page.locator('text=This message will be deleted')).toBeVisible()
    
    // Hover to show delete button
    await page.locator('text=This message will be deleted').hover()
    
    // Check delete button appears on hover
    await expect(page.locator('[data-testid="delete-message-button"]')).toBeVisible()
  })

  test('should show search results correctly', async ({ page }) => {
    const mockThreads = [
      {
        id: 'thread-1',
        listing: { title: 'Car for sale', price: 50000, images: [], owner_id: 'owner-1' },
        last_message: 'Interested in the car',
        updated_at: '2024-01-01T12:00:00Z',
        unread_count: 0,
        participants: [
          { user: { id: 'test-user-id', display_name: 'Test User', avatar_url: null } },
          { user: { id: 'seller-id', display_name: 'Car Seller', avatar_url: null } }
        ]
      }
    ]

    await page.route('**/api/v1/threads', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockThreads)
      })
    })

    await page.goto('/messages')
    
    // Search for non-existent term
    await page.locator('[data-testid="search-input"]').fill('bicycle')
    
    // Should show no results message
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
    await expect(page.locator('text=検索結果が見つかりません')).toBeVisible()
    await expect(page.locator('text=「bicycle」に一致するメッセージが見つかりませんでした')).toBeVisible()
  })
})