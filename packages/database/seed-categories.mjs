import postgres from 'postgres';

async function seedCategories() {
  const dbUrl = "postgresql://postgres:8W%25%21l5%5EuJ2tSlvMu@db.pmuqyodmqincefdolkcm.supabase.co:5432/postgres";
  const sql = postgres(dbUrl);
  
  try {
    // Get the tenant ID
    const tenants = await sql`SELECT id FROM tenants LIMIT 1`;
    if (!tenants.length) {
      console.error('No tenants found');
      process.exit(1);
    }
    const tenantId = tenants[0].id;
    console.log(`Using tenant: ${tenantId}`);

    const categories = [
      { name: "Office Supplies", description: "Pens, paper, ink, envelopes, and office stationery", tax_code: "4100" },
      { name: "Printing & Copying", description: "Business printing, copying, and bindery services", tax_code: "4105" },
      { name: "Postage & Courier", description: "Postage, couriers, and shipping expenses", tax_code: "4110" },
      { name: "Telephone & Internet", description: "Phone and internet services for business use", tax_code: "4115" },
      { name: "Travel - Airfare", description: "Flights for business travel", tax_code: "4200" },
      { name: "Travel - Accommodation", description: "Hotels and accommodation for business travel", tax_code: "4205" },
      { name: "Travel - Meals", description: "Meals while traveling for business", tax_code: "4210" },
      { name: "Travel - Vehicle", description: "Mileage and vehicle expenses for business travel", tax_code: "4215" },
      { name: "Local Transport", description: "Local taxi, bus, train fares and parking", tax_code: "4220" },
      { name: "Vehicle Fuel", description: "Petrol, diesel, and fuel for business vehicles", tax_code: "4225" },
      { name: "Vehicle Maintenance", description: "Car maintenance, servicing, tyres, and repairs", tax_code: "4230" },
      { name: "Vehicle Registration & Insurance", description: "Rego, WOF, and vehicle insurance", tax_code: "4235" },
      { name: "Accommodation - Studio Rent", description: "Studio or workspace rental", tax_code: "4300" },
      { name: "Utilities - Electricity", description: "Electricity for business premises", tax_code: "4310" },
      { name: "Utilities - Water & Sewerage", description: "Water and sewerage for business premises", tax_code: "4315" },
      { name: "Utilities - Gas", description: "Gas for business premises", tax_code: "4320" },
      { name: "Rates & Property Tax", description: "Council rates and property taxes", tax_code: "4325" },
      { name: "Equipment & Hardware", description: "Camera bodies, lenses, lighting, computers, and hardware", tax_code: "4400" },
      { name: "Software & Subscriptions", description: "Photography software, Creative Cloud, Lightroom, Capture One, etc", tax_code: "4405" },
      { name: "Repairs & Maintenance", description: "Equipment repairs and maintenance", tax_code: "4410" },
      { name: "Insurance - Professional Indemnity", description: "Professional indemnity insurance", tax_code: "4500" },
      { name: "Insurance - Business Property", description: "Buildings and contents insurance", tax_code: "4505" },
      { name: "Insurance - Liability", description: "Public and product liability insurance", tax_code: "4510" },
      { name: "Client Entertainment", description: "Meals and entertainment with clients (50% deductible)", tax_code: "4600" },
      { name: "Professional Development", description: "Courses, workshops, training, and professional fees", tax_code: "4700" },
      { name: "Subscriptions - Professional", description: "Professional body memberships and subscriptions", tax_code: "4705" },
      { name: "Advertising & Marketing", description: "Website, social media, prints, and marketing expenses", tax_code: "4800" },
      { name: "Sponsorships & Donations", description: "Business sponsorships and charitable donations", tax_code: "4805" },
      { name: "Subcontractors & Freelancers", description: "Payments to other photographers and service providers", tax_code: "4900" },
      { name: "Bank Fees & Interest", description: "Bank fees, credit card fees, and interest", tax_code: "5000" },
      { name: "Accounting & Legal", description: "Accountant fees, legal advice, and tax advice", tax_code: "5100" },
      { name: "Licensing & Permits", description: "Business licenses, permits, and registrations", tax_code: "5200" },
      { name: "Books & Publications", description: "Professional books, magazines, and publications", tax_code: "5300" },
      { name: "Other Business Expenses", description: "Miscellaneous business expenses not listed above", tax_code: "5900" },
    ];

    console.log(`Inserting ${categories.length} expense categories...`);
    
    let inserted = 0;
    for (const cat of categories) {
      try {
        await sql`
          INSERT INTO expense_categories (tenant_id, name, description, tax_code, is_deductible, is_active)
          VALUES (${tenantId}, ${cat.name}, ${cat.description}, ${cat.tax_code}, true, true)
          ON CONFLICT DO NOTHING
        `;
        inserted++;
      } catch (e) {
        console.warn(`⚠ Failed to insert ${cat.name}: ${e.message.substring(0, 80)}`);
      }
    }

    console.log(`✓ Inserted ${inserted}/${categories.length} categories`);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

seedCategories();
