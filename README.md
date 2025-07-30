# MyShop - Inventory & Sales Management System

A complete inventory and sales management system built with Laravel 12, Inertia.js, and React. Features role-based access control with Admin and Manager roles, real-time notifications, and comprehensive reporting.

## Features

### Admin Features
- **Product Management**: Full CRUD operations for products with inventory tracking
- **User Management**: Create and manage user accounts with role assignments
- **Analytics**: Sales reports and top product analytics
- **Real-time Notifications**: Receive notifications when sales are completed

### Manager Features
- **Shopping Cart**: Add products to cart with quantity and pricing controls
- **Sales Processing**: Complete sales with automatic stock updates
- **Receipt Generation**: Automatic PDF receipt generation for completed sales
- **Sales History**: View personal sales history and receipts

### Technical Features
- **Role-based Authorization**: Secure access control using Laravel Gates
- **Real-time Broadcasting**: Live notifications using Laravel Echo
- **PDF Generation**: Automatic receipt generation
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Form Validation**: Comprehensive client and server-side validation

## Prerequisites

- PHP 8.2+
- Composer
- Node.js 18+
- MySQL/PostgreSQL/SQLite
- Redis (for broadcasting)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd myshop
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Install Node.js dependencies**
   ```bash
   npm install
   ```

4. **Environment setup**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

5. **Configure your database in `.env`**
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=myshop
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   ```

6. **Run database migrations**
   ```bash
   php artisan migrate
   ```

7. **Seed the database with sample products**
   ```bash
   php artisan db:seed --class=ProductSeeder
   ```

8. **Create an admin user**
   ```bash
   php artisan tinker
   ```
   ```php
   \App\Models\User::create([
       'name' => 'Admin User',
       'email' => 'admin@myshop.com',
       'password' => Hash::make('password'),
       'role' => 'admin'
   ]);
   ```

9. **Build frontend assets**
   ```bash
   npm run build
   ```

## Development

### Start the development server
```bash
# Start Laravel development server
php artisan serve

# Start Vite development server
npm run dev

# Start queue worker (for broadcasting)
php artisan queue:work

# Start broadcasting server (if using Laravel WebSockets)
php artisan websockets:serve
```

### Environment Variables for Broadcasting

Add these to your `.env` file for real-time notifications:

```env
# For Pusher
PUSHER_APP_ID=your_app_id
PUSHER_APP_KEY=your_app_key
PUSHER_APP_SECRET=your_app_secret
PUSHER_APP_CLUSTER=your_cluster

# For Laravel WebSockets
PUSHER_APP_ID=12345
PUSHER_APP_KEY=your_key
PUSHER_APP_SECRET=your_secret
PUSHER_HOST=127.0.0.1
PUSHER_PORT=6001
PUSHER_SCHEME=http
PUSHER_APP_CLUSTER=mt1

# Broadcasting configuration
BROADCAST_DRIVER=pusher
```

## Usage

### Admin Workflow
1. **Login** as an admin user
2. **Manage Products**: Add, edit, and delete products in the inventory
3. **Manage Users**: Create and manage user accounts
4. **View Analytics**: Monitor sales performance and top products
5. **Receive Notifications**: Get real-time notifications when sales are completed

### Manager Workflow
1. **Login** as a manager user
2. **Add to Cart**: Select products and add them to cart
3. **Adjust Pricing**: Set sale prices (must be >= MSRP)
4. **Complete Sale**: Checkout to process the sale
5. **Download Receipt**: Automatically generated PDF receipt

## API Endpoints

### Admin Endpoints (requires `isAdmin` gate)
- `GET|POST|PUT|DELETE /api/products` - Product management
- `GET|POST|PUT|DELETE /api/users` - User management
- `GET /api/analytics/sales` - Sales analytics
- `GET /api/analytics/top-products` - Top products report

### Manager Endpoints (requires `isManager` gate)
- `GET /api/cart` - View cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/{id}` - Update cart item
- `DELETE /api/cart/items/{id}` - Remove cart item
- `POST /api/cart/checkout` - Complete sale

## Database Schema

### Users Table
- `id` - Primary key
- `name` - User's full name
- `email` - Unique email address
- `password` - Hashed password
- `role` - ENUM('admin', 'manager') - User role
- `timestamps` - Created/updated timestamps

### Products Table
- `id` - Primary key
- `name` - Product name
- `sku` - Unique SKU
- `cost_price` - Product cost
- `msrp` - Manufacturer's suggested retail price
- `quantity_on_hand` - Current stock level
- `timestamps` - Created/updated timestamps

### Sales Table
- `id` - Primary key
- `manager_id` - Foreign key to users table
- `total_amount` - Total sale amount
- `timestamps` - Created/updated timestamps

### Sale Items Table
- `id` - Primary key
- `sale_id` - Foreign key to sales table
- `product_id` - Foreign key to products table
- `quantity` - Quantity sold
- `sale_price` - Price at which item was sold
- `timestamps` - Created/updated timestamps

### Notifications Table
- `id` - Primary key
- `user_id` - Foreign key to users table
- `type` - Notification type
- `payload` - JSON payload
- `is_read` - Boolean read status
- `timestamps` - Created/updated timestamps

## Security Features

- **Role-based Access Control**: Users can only access features appropriate to their role
- **Form Validation**: Comprehensive validation on both client and server side
- **CSRF Protection**: All forms protected against CSRF attacks
- **Input Sanitization**: All user inputs are properly sanitized
- **Database Transactions**: Critical operations wrapped in transactions

## Customization

### Adding New Roles
1. Update the `role` enum in the users migration
2. Add new gates in `AppServiceProvider`
3. Create role-specific middleware
4. Update frontend role checks

### Adding New Product Fields
1. Create a new migration to add fields
2. Update the Product model
3. Update form validation rules
4. Update frontend forms

### Customizing Receipts
1. Modify `resources/views/receipts/sale.blade.php`
2. Update the receipt generation logic in `CartController`
3. Add custom styling as needed

## Troubleshooting

### Common Issues

**Migration Errors**
```bash
php artisan migrate:fresh --seed
```

**Permission Issues**
```bash
chmod -R 775 storage bootstrap/cache
```

**Queue Issues**
```bash
php artisan queue:restart
php artisan queue:work
```

**Asset Build Issues**
```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT). 