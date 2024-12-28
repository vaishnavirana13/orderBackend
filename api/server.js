const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const moment = require('moment-timezone');
const supabase = require('./db'); // Import the Supabase client

const app = express();

app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' })); // Adjust frontend URL if needed

// Test the server and database connection
app.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('orders').select('*').limit(1);
    if (error) throw error;

    res.status(200).send('Database is connected and server is running!');
  } catch (err) {
    console.error('Database connection failed:', err);
    res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id, orderdescription, created_at');

    if (error) {
      console.error('Error fetching orders:', error);
      return res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
    }

    const formattedOrders = data.map((entry) => ({
      orderId: entry.id,
      orderDescription: entry.orderdescription,
      created_at: moment(entry.created_at).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'),
    }));

    res.status(200).json(formattedOrders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders', details: err.message });
  }
});

// Create a new Order and link it to a Product
app.post('/api/orders', async (req, res) => {
  const { orderDescription, createdAt, productId, quantity } = req.body;

  if (!productId || quantity <= 0) {
    return res.status(400).json({ error: 'Invalid product ID or quantity.' });
  }

  try {
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([{ orderDescription, created_at: createdAt }])
      .select('Id');

    if (orderError) throw orderError;
    const orderId = orderData[0].Id;

    const { error: linkError } = await supabase
      .from('orderproductmap')
      .insert([{ order_id: orderId, product_id: productId, quantity }]);

    if (linkError) throw linkError;

    res.status(201).json({
      message: 'Order created and product linked successfully',
      orderId,
      orderDescription,
      productId,
      quantity,
    });
  } catch (err) {
    console.error('Error adding order:', err);
    res.status(500).json({ error: 'Error adding order', details: err.message });
  }
});

// Update an Order and modify only the product quantity (not description)
app.put('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { createdAt, productId, quantity } = req.body;

  if (quantity <= 0 || !productId) {
    return res.status(400).json({ error: 'Invalid product ID or quantity.' });
  }

  try {
    const { error: updateError } = await supabase
      .from('orders')
      .update({ created_at: createdAt })
      .match({ Id: id });

    if (updateError) throw updateError;

    const { data: existingMapping, error: mappingError } = await supabase
      .from('orderproductmap')
      .select('*')
      .match({ order_id: id, product_id: productId });

    if (mappingError) throw mappingError;

    if (existingMapping.length > 0) {
      const { error: quantityError } = await supabase
        .from('orderproductmap')
        .update({ quantity })
        .match({ order_id: id, product_id: productId });

      if (quantityError) throw quantityError;
    } else {
      const { error: createError } = await supabase
        .from('orderproductmap')
        .insert([{ order_id: id, product_id: productId, quantity }]);

      if (createError) throw createError;
    }

    res.status(200).json({ message: 'Order updated successfully' });
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({ error: 'Error updating order', details: err.message });
  }
});

// Delete an Order
app.delete('/api/orders/:id', async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ error: 'Invalid order ID.' });
  }

  try {
    const { error: deleteMappingError } = await supabase
      .from('orderproductmap')
      .delete()
      .match({ order_id: parseInt(id) });

    if (deleteMappingError) throw deleteMappingError;

    const { data, error: deleteError } = await supabase
      .from('orders')
      .delete()
      .match({ Id: parseInt(id) });

    if (deleteError) throw deleteError;
    if (data.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    res.json({ message: 'Order deleted successfully.' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'An error occurred while deleting the order.' });
  }
});

// Fetch all Order-Product mappings
app.get('/api/orderproductmap', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orderproductmap')
      .select('*');

    if (error) {
      console.error('Error fetching order-product mappings:', error);
      return res.status(500).json({ error: 'Failed to fetch order-product mappings', details: error.message });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error('Error fetching order-product mappings:', err);
    res.status(500).json({ error: 'Failed to fetch order-product mappings', details: err.message });
  }
});

// Fetch all Cart details
app.get('/api/cart', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cart')
      .select('productid, productname, productdescription');

    if (error) {
      console.error('Error fetching cart data:', error);
      return res.status(500).json({ error: 'Failed to fetch cart data', details: error.message });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error('Error fetching cart data:', err);
    res.status(500).json({ error: 'Failed to fetch cart data', details: err.message });
  }
});

// Fetch customer details from the 'customers' table
app.get('/api/customers', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('id, email, customer_name');

    if (error) {
      console.error('Error fetching customers:', error);
      return res.status(500).json({ error: 'Failed to fetch customer data', details: error.message });
    }

    res.status(200).json(data || []);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ error: 'Unexpected error fetching customer data', details: err.message });
  }
});

// Example backend route for fetching customer details by order ID
app.get('/api/customers/:orderId', async (req, res) => {
  const { orderId } = req.params;
  try {
    const customer = await db('customers')
      .select('email')
      .where('id', orderId) // Fetching customer details based on order ID
      .first();
    if (customer) {
      res.json(customer);
    } else {
      res.status(404).json({ message: 'Customer not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customer details' });
  }
});

// Export the server as a handler for Vercel serverless function
module.exports = app;
