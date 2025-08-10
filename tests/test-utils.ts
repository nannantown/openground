// Test utilities for requirement-driven testing
// Generated automatically - DO NOT MODIFY

export class TestDataBuilder {
  static createUser(overrides: Partial<any> = {}) {
    return {
      id: 'test-user-id',
      email: 'test@example.com',
      display_name: 'Test User',
      avatar_url: null,
      is_verified: false,
      created_at: new Date().toISOString(),
      ...overrides
    }
  }

  static createListing(overrides: Partial<any> = {}) {
    return {
      id: 'test-listing-id',
      title: 'Test Product',
      description: 'Test description',
      price: 10000,
      category: 'Electronics',
      images: ['test-image.jpg'],
      status: 'active',
      created_at: new Date().toISOString(),
      user_id: 'test-user-id',
      ...overrides
    }
  }

  static createMessage(overrides: Partial<any> = {}) {
    return {
      id: 'test-message-id',
      thread_id: 'test-thread-id',
      sender_id: 'test-user-id',
      body: 'Test message',
      image_urls: [],
      created_at: new Date().toISOString(),
      read_by: [],
      ...overrides
    }
  }
}

export class PageHelpers {
  static async loginUser(page: any, email: string = 'test@example.com') {
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', email)
    await page.click('[data-testid="login-button"]')
    // Add OTP verification logic if needed
  }

  static async createListing(page: any, data: any) {
    await page.goto('/new-listing')
    await page.fill('[data-testid="title-input"]', data.title)
    await page.fill('[data-testid="description-input"]', data.description)
    await page.fill('[data-testid="price-input"]', data.price.toString())
    await page.selectOption('[data-testid="category-select"]', data.category)
    await page.click('[data-testid="submit-button"]')
  }

  static async searchListings(page: any, query: string) {
    await page.goto('/')
    await page.fill('[data-testid="search-input"]', query)
    await page.press('[data-testid="search-input"]', 'Enter')
  }
}
