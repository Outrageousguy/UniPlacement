const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');

// Configure WebSocket for Neon
require('@neondatabase/serverless').neonConfig.webSocketConstructor = ws;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Increase max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 30000,
});

async function performanceTest() {
  console.log('=== Performance Analysis ===');
  
  const db = require('drizzle-orm/neon-serverless').drizzle(pool, { 
    schema: require('./shared/schema.js') 
  });
  
  const start = Date.now();
  
  try {
    // Test 1: Simple query
    console.log('Testing simple student query...');
    const simpleStart = Date.now();
    await db.select().from(require('./shared/schema.js').students).limit(1);
    console.log(`Simple query took: ${Date.now() - simpleStart}ms`);
    
    // Test 2: Query with join
    console.log('Testing query with joins...');
    const joinStart = Date.now();
    await db.select()
      .from(require('./shared/schema.js').discussions)
      .leftJoin(
        require('./shared/schema.js').students,
        require('./shared/schema.js').eq(require('./shared/schema.js').discussions.authorId, require('./shared/schema.js').students.id)
      )
      .limit(5);
    console.log(`Join query took: ${Date.now() - joinStart}ms`);
    
    // Test 3: Multiple parallel queries (N+1 problem simulation)
    console.log('Testing N+1 query problem...');
    const n1Start = Date.now();
    const discussions = await db.select().from(require('./shared/schema.js').discussions).limit(5);
    
    // This simulates the N+1 problem in your current code
    for (const discussion of discussions) {
      await db.select()
        .from(require('./shared/schema.js').students)
        .where(require('./shared/schema.js').eq(require('./shared/schema.js').students.id, discussion.authorId))
        .limit(1);
    }
    console.log(`N+1 simulation took: ${Date.now() - n1Start}ms`);
    
    // Test 4: Batch query with proper joins
    console.log('Testing optimized batch query...');
    const batchStart = Date.now();
    await db.select({
      id: require('./shared/schema.js').discussions.id,
      title: require('./shared/schema.js').discussions.title,
      authorName: require('./shared/schema.js').students.name,
      authorBranch: require('./shared/schema.js').students.branch
    })
    .from(require('./shared/schema.js').discussions)
    .leftJoin(
      require('./shared/schema.js').students,
      require('./shared/schema.js').eq(require('./shared/schema.js').discussions.authorId, require('./shared/schema.js').students.id)
    )
    .limit(5);
    console.log(`Optimized batch query took: ${Date.now() - batchStart}ms`);
    
  } catch (error) {
    console.error('Performance test error:', error);
  } finally {
    console.log(`Total test time: ${Date.now() - start}ms`);
    await pool.end();
  }
}

performanceTest();
