import Cookies from 'js-cookie';

interface LoginResponse {
    token: string;
}

export const Auth =  {
    handleLogin: async (email: string, password: string) => {
        try {
            const response = await fetch(`https://${process.env.NEXT_PUBLIC_BACKEND_IP}/api/v1/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "email": email,
                    "password": password,
                }),
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const data: LoginResponse = await response.json();

            // Store the token and email in cookies (expires in 24 hours)
            Cookies.set('jwt_token', data.token, {expires: 1});
            Cookies.set('user_email', email, {expires: 1});

            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    handleSignup: async (email: string, password: string) => {
        try {
            console.log("Signup called");
            console.log(email);
            console.log(password);
            const response = await fetch(`https://${process.env.NEXT_PUBLIC_BACKEND_IP}/api/v1/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "email": email,
                    "password": password,
                })
            })
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    },

    // Function to check if user is authenticated
    isAuthenticated: () => {
        return !!Cookies.get('jwt_token');
    },

    // Function to get the JWT token
    getToken: () => {
        return Cookies.get('jwt_token');
    },

    // Function to get the user email
    getUserEmail: () => {
        return Cookies.get('user_email');
    },

    // Function to logout
    logout: () => {
        Cookies.remove('jwt_token');
        Cookies.remove('user_email');
    },

    setRequestId: (requestId: string) => {
        Cookies.set('request_id', requestId, { expires: 1 }); // Expires in 1 day
    },

    getRequestId: () => {
        return Cookies.get('request_id');
    },

    clearRequestId: () => {
        Cookies.remove('request_id');
    }


}

