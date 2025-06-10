# BookMark App

This is a simple bookmark application built with React and Vite, using Supabase for authentication and database services.

## Features

- User authentication (Sign up, Sign in, Sign out)
- Add, view, edit, and delete bookmarks
- Responsive design

## Technologies Used

- React
- Vite
- Supabase (Authentication, Database)
- React Router DOM


## Setup and Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/atharvabaodhankar/BookMark.git
    cd BookMark/client
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up Supabase:**

    a. Create a new project on [Supabase](https://supabase.io/).
    b. Get your Supabase URL and Anon Key from your project settings (Settings > API).

4.  **Configure environment variables:**

    Create a `.env` file in the `client` directory (or copy from `.env.example`) and add your Supabase credentials:


5.  **Run the application:**

    ```bash
    npm run dev
    ```

    The application will be accessible at `http://localhost:5173` (or another port if 5173 is in use).

## Project Structure

```
client/
├── public/
├── src/
│   ├── assets/
│   ├── components/       # React components
│   ├── App.css           # Global styles
│   ├── App.jsx           # Main application component
│   ├── main.jsx          # Entry point
│   └── supabaseClient.js # Supabase client initialization
├── .env.example          # Example environment variables
├── index.html            # HTML entry file
├── package.json          # Project dependencies and scripts
├── vite.config.js        # Vite configuration
└── README.md             # Project README
```

## Contributing

Feel free to fork the repository and contribute. Pull requests are welcome!

## License

This project is open source and available under the MIT License.
