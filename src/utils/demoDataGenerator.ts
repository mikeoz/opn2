import { supabase } from '@/integrations/supabase/client';

// Demo data templates for realistic generation
const FIRST_NAMES = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Christopher', 'Karen', 'Charles', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Helen', 'Mark', 'Sandra', 'Donald', 'Donna',
  'Steven', 'Carol', 'Paul', 'Ruth', 'Andrew', 'Sharon', 'Joshua', 'Michelle'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young'
];

const EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];

const BUSINESS_CATEGORIES = {
  'Restaurant': ['Appetizers', 'Entrees', 'Desserts', 'Beverages', 'Specials'],
  'Retail': ['Clothing', 'Accessories', 'Electronics', 'Home Goods', 'Books'],
  'Fitness': ['Memberships', 'Personal Training', 'Classes', 'Equipment', 'Supplements'],
  'Beauty': ['Haircuts', 'Coloring', 'Treatments', 'Products', 'Packages'],
  'Professional': ['Consultations', 'Services', 'Packages', 'Workshops', 'Materials']
};

const INTERACTION_TYPES = ['visit', 'purchase', 'inquiry', 'consultation', 'referral', 'review'];

export interface CustomerProfile {
  customer_name: string;
  customer_email?: string;
  phone_number?: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  demographics: {
    age_range?: string;
    gender?: string;
    income_level?: string;
  };
  preferences: {
    communication_method?: string;
    interests?: string[];
    visit_frequency?: string;
  };
  customer_status: 'prospect' | 'active' | 'inactive' | 'vip';
  data_completeness_score: number;
}

export interface InventoryItem {
  item_name: string;
  item_category: string;
  description?: string;
  price_range: 'low' | 'medium' | 'high' | 'premium';
  availability_status: 'available' | 'limited' | 'out_of_stock';
  seasonal_info: {
    peak_season?: string;
    availability_months?: number[];
  };
}

export interface GenerationParams {
  customerCount: number;
  inventoryCount: number;
  interactionHistory: boolean;
  dataCompletenessVariation: boolean;
  businessType: keyof typeof BUSINESS_CATEGORIES;
}

class DemoDataGenerator {
  private getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private generateRandomEmail(firstName: string, lastName: string): string {
    const domain = this.getRandomElement(EMAIL_DOMAINS);
    const variations = [
      `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
      `${firstName.toLowerCase()}${lastName.toLowerCase()}@${domain}`,
      `${firstName.toLowerCase()}_${lastName.toLowerCase()}@${domain}`,
      `${firstName.toLowerCase()}${Math.floor(Math.random() * 999)}@${domain}`
    ];
    return this.getRandomElement(variations);
  }

  private generatePhoneNumber(): string {
    const areaCode = Math.floor(Math.random() * 800) + 200;
    const exchange = Math.floor(Math.random() * 800) + 200;
    const number = Math.floor(Math.random() * 9000) + 1000;
    return `(${areaCode}) ${exchange}-${number}`;
  }

  private calculateDataCompleteness(profile: Partial<CustomerProfile>): number {
    let score = 0;
    const weights = {
      customer_name: 20,
      customer_email: 25,
      phone_number: 20,
      address: 15,
      demographics: 10,
      preferences: 10
    };

    if (profile.customer_name) score += weights.customer_name;
    if (profile.customer_email) score += weights.customer_email;
    if (profile.phone_number) score += weights.phone_number;
    if (profile.address && Object.keys(profile.address).length > 0) score += weights.address;
    if (profile.demographics && Object.keys(profile.demographics).length > 0) score += weights.demographics;
    if (profile.preferences && Object.keys(profile.preferences).length > 0) score += weights.preferences;

    return score;
  }

  generateCustomerProfile(params: { includeEmail?: boolean; dataCompleteness?: 'high' | 'medium' | 'low' }): CustomerProfile {
    const firstName = this.getRandomElement(FIRST_NAMES);
    const lastName = this.getRandomElement(LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;

    const profile: Partial<CustomerProfile> = {
      customer_name: fullName,
      customer_status: this.getRandomElement(['prospect', 'active', 'inactive', 'vip'])
    };

    // Determine data completeness level
    const completeness = params.dataCompleteness || this.getRandomElement(['high', 'medium', 'low']);
    const includeEmail = params.includeEmail !== false && (completeness === 'high' || Math.random() > 0.3);

    if (includeEmail) {
      profile.customer_email = this.generateRandomEmail(firstName, lastName);
    }

    if (completeness === 'high' || Math.random() > 0.4) {
      profile.phone_number = this.generatePhoneNumber();
    }

    if (completeness === 'high' || Math.random() > 0.5) {
      profile.address = {
        street: `${Math.floor(Math.random() * 9999) + 1} ${this.getRandomElement(['Main', 'Oak', 'Elm', 'Pine', 'Maple'])} St`,
        city: this.getRandomElement(['Springfield', 'Franklin', 'Riverside', 'Madison', 'Georgetown']),
        state: this.getRandomElement(['CA', 'NY', 'TX', 'FL', 'IL']),
        zip: `${Math.floor(Math.random() * 90000) + 10000}`
      };
    }

    if (completeness === 'high' || Math.random() > 0.6) {
      profile.demographics = {
        age_range: this.getRandomElement(['18-25', '26-35', '36-45', '46-55', '56-65', '65+']),
        gender: this.getRandomElement(['Male', 'Female', 'Other']),
        income_level: this.getRandomElement(['Low', 'Medium', 'High', 'Premium'])
      };
    }

    if (completeness === 'high' || Math.random() > 0.7) {
      profile.preferences = {
        communication_method: this.getRandomElement(['Email', 'Phone', 'Text', 'Mail']),
        interests: this.getRandomElement([
          ['Technology', 'Gaming'],
          ['Health', 'Fitness'],
          ['Travel', 'Food'],
          ['Arts', 'Music'],
          ['Sports', 'Outdoors']
        ]),
        visit_frequency: this.getRandomElement(['Weekly', 'Monthly', 'Quarterly', 'Rarely'])
      };
    }

    profile.data_completeness_score = this.calculateDataCompleteness(profile);

    return profile as CustomerProfile;
  }

  generateInventoryItem(businessType: keyof typeof BUSINESS_CATEGORIES): InventoryItem {
    const categories = BUSINESS_CATEGORIES[businessType];
    const category = this.getRandomElement(categories);
    
    const itemNames = {
      'Appetizers': ['Calamari Rings', 'Spinach Dip', 'Wings', 'Nachos', 'Bruschetta'],
      'Entrees': ['Grilled Salmon', 'Ribeye Steak', 'Chicken Parmesan', 'Pasta Primavera', 'Fish Tacos'],
      'Clothing': ['Designer Jeans', 'Silk Blouse', 'Leather Jacket', 'Summer Dress', 'Casual Shirt'],
      'Memberships': ['Basic Plan', 'Premium Plan', 'VIP Access', 'Family Package', 'Student Discount'],
      'Haircuts': ['Classic Cut', 'Layered Style', 'Bob Cut', 'Pixie Cut', 'Beard Trim']
    };

    const nameOptions = itemNames[category as keyof typeof itemNames] || [`${category} Item ${Math.floor(Math.random() * 100)}`];
    
    return {
      item_name: this.getRandomElement(nameOptions),
      item_category: category,
      description: `High-quality ${category.toLowerCase()} offering excellent value`,
      price_range: this.getRandomElement(['low', 'medium', 'high', 'premium']),
      availability_status: this.getRandomElement(['available', 'available', 'available', 'limited', 'out_of_stock']),
      seasonal_info: {
        peak_season: this.getRandomElement(['Spring', 'Summer', 'Fall', 'Winter', 'Year-round']),
        availability_months: Array.from({length: Math.floor(Math.random() * 12) + 1}, (_, i) => i + 1)
      }
    };
  }

  generateInteractionHistory(customerId: string, count: number = 5) {
    const interactions = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      const daysAgo = Math.floor(Math.random() * 365);
      const interactionDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      
      interactions.push({
        id: crypto.randomUUID(),
        type: this.getRandomElement(INTERACTION_TYPES),
        date: interactionDate.toISOString(),
        details: `Customer interaction on ${interactionDate.toLocaleDateString()}`,
        value: Math.floor(Math.random() * 500) + 10
      });
    }
    
    return interactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async generateAndSaveCustomers(merchantId: string, params: GenerationParams) {
    const customers = [];
    
    for (let i = 0; i < params.customerCount; i++) {
      const dataCompleteness = params.dataCompletenessVariation 
        ? this.getRandomElement(['high', 'medium', 'low'] as const)
        : 'high';
        
      const customer = this.generateCustomerProfile({ dataCompleteness });
      
      const customerData = {
        merchant_id: merchantId,
        ...customer,
        interaction_history: params.interactionHistory 
          ? this.generateInteractionHistory(crypto.randomUUID())
          : [],
        total_interactions: params.interactionHistory ? Math.floor(Math.random() * 20) : 0,
        last_interaction_at: params.interactionHistory 
          ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
          : null
      };
      
      customers.push(customerData);
    }

    const { data, error } = await supabase
      .from('merchant_customers')
      .insert(customers)
      .select();

    if (error) throw error;
    return data;
  }

  async generateAndSaveInventory(merchantId: string, params: GenerationParams) {
    const inventory = [];
    
    for (let i = 0; i < params.inventoryCount; i++) {
      const item = this.generateInventoryItem(params.businessType);
      inventory.push({
        merchant_id: merchantId,
        ...item
      });
    }

    const { data, error } = await supabase
      .from('merchant_inventory')
      .insert(inventory)
      .select();

    if (error) throw error;
    return data;
  }

  exportToCSV(data: any[], filename: string): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'object' && value !== null) {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          }
          return `"${String(value || '').replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return csvContent;
  }
}

export const demoDataGenerator = new DemoDataGenerator();