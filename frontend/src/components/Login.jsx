import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState(''); 
  
  const [isLoginView, setIsLoginView] = useState(true);
  const [isLoading, setIsLoading] = useState(false); 
  
  const [errorMessage, setErrorMessage] = useState(''); 
  const [successMessage, setSuccessMessage] = useState(''); 
  
  const navigate = useNavigate();
  // 1. Initialize state by checking if they previously saved a dark theme preference
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('sky_theme') === 'dark';
  });

  // 2. Update the HTML class AND save their choice to localStorage whenever they click the toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sky_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sky_theme', 'light');
    }
  }, [isDarkMode]);

  // --- VALIDATION HELPERS ---
  const validateEmail = (emailStr) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(emailStr);
  };

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(pwd)) return "Password must contain at least one uppercase letter.";
    if (!/[0-9]/.test(pwd)) return "Password must contain at least one number.";
    if (!/[!@#$%^&*]/.test(pwd)) return "Password must contain at least one special character (!@#$%^&*).";
    return null;
  };

  // --- REAL-TIME STATUS CHECKS ---
  const isEmailValid = email.length > 0 && validateEmail(email);
  const isEmailInvalid = email.length > 0 && !isEmailValid;

  const pwdError = validatePassword(password);
  // During login, we just check if password has text. During signup, we enforce strict rules.
  const isPwdValid = isLoginView ? password.length > 0 : (password.length > 0 && pwdError === null);
  const isPwdInvalid = !isLoginView && password.length > 0 && pwdError !== null;

  const isConfirmPwdValid = confirmPassword.length > 0 && password === confirmPassword;
  const isConfirmPwdInvalid = confirmPassword.length > 0 && password !== confirmPassword;

  const isNameValid = fullName.trim().length > 0;
  const isNameInvalid = fullName !== '' && fullName.trim().length === 0;

  // Are all required fields green?
  const isFormReadyToSubmit = isLoginView 
    ? (isEmailValid && password.length > 0)
    : (isNameValid && isEmailValid && isPwdValid && isConfirmPwdValid);

  // --- DYNAMIC CSS GENERATOR ---
  const getInputClasses = (isValid, isInvalid) => {
    const baseClasses = "w-full pl-11 pr-11 py-3 bg-transparent border rounded-xl text-sm focus:outline-none focus:ring-1 transition-all dark:placeholder-gray-500";
    
    if (isValid) {
      return `${baseClasses} border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500 bg-emerald-50/10 dark:bg-emerald-900/10 text-emerald-900 dark:text-emerald-100`;
    }
    if (isInvalid) {
      return `${baseClasses} border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50/10 dark:bg-red-900/10 text-red-900 dark:text-red-100`;
    }
    // Default empty state
    return `${baseClasses} border-gray-200 dark:border-gray-700 focus:border-cyan-500 focus:ring-cyan-500`;
  };

  // --- DYNAMIC ICON RENDERER ---
  const StatusIcon = ({ isValid, isInvalid }) => {
    if (isValid) {
      return (
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none animate-fade-in">
          <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
        </div>
      );
    }
    if (isInvalid) {
      return (
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none animate-fade-in">
          <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </div>
      );
    }
    return null;
  };

// --- MAIN AUTHENTICATION HANDLER ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    if (!isLoginView) {
      // --- SIGN UP LOGIC ---
      if (!validateEmail(email)) {
        setErrorMessage("Please enter a valid email address.");
        setIsLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match. Please try again.");
        setIsLoading(false);
        return;
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        setErrorMessage(passwordError);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("http://127.0.0.1:8000/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email,
            password: password,
            full_name: fullName || "Sky Innovators User"
          }),
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.detail || "Failed to create account");

        setSuccessMessage("Account securely created! You may now sign in.");
        setPassword('');
        setConfirmPassword('');
        setEmail('');
        setFullName('');
        setIsLoginView(true);

      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    } else {
      // --- LOG IN LOGIC ---
      try {
        const response = await fetch("http://127.0.0.1:8000/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email,
            password: password,
          }),
        });

        const data = await response.json();

        // If Python rejects the credentials (e.g., wrong password or email)
        if (!response.ok) {
          throw new Error(data.detail || "Invalid email or password");
        }

        // Success! Save the token and user data to the browser
        localStorage.setItem("sky_token", data.access_token);
        localStorage.setItem("sky_user", JSON.stringify(data.user_info));

        // Route them securely to the dashboard
        navigate('/dashboard');

      } catch (error) {
        // Display the "Invalid email or password" message in the red UI box
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };


  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-900 font-sans text-gray-900 dark:text-white transition-colors duration-300">
      
      {/* LEFT COLUMN: Authentication Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-between px-8 sm:px-16 md:px-24 py-10 relative z-10">
        <div></div>

        <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center transition-all duration-300">
          
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </div>
            <span className="text-3xl font-bold tracking-tight">SkyInnovators</span>
          </div>

          <h1 className="text-2xl font-bold mb-2">
            {isLoginView ? "Welcome back" : "Get started with SkyInnovators"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
            {isLoginView ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => {
                setIsLoginView(!isLoginView);
                setErrorMessage(''); 
                setSuccessMessage('');
                setConfirmPassword(''); 
                setPassword('');
              }} 
              className="text-gray-900 dark:text-white font-semibold hover:underline focus:outline-none"
            >
              {isLoginView ? "Sign up" : "Sign in"}
            </button>
          </p>

          <div className="flex w-full justify-between gap-4 mb-8">
            <button className="flex-1 flex items-center justify-center py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            </button>
            <button className="flex-1 flex items-center justify-center py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-900 dark:text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.34-.85 3.73-.78 1.48.05 2.55.6 3.26 1.49-3.02 1.88-2.5 5.56.57 6.83-1.28 2.3-2.68 3.7-3.64 4.63zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
            </button>
            <button className="flex-1 flex items-center justify-center py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-semibold text-sm text-gray-900 dark:text-white">
              SSO
            </button>
          </div>

          <div className="flex items-center w-full mb-8">
            <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
            <span className="px-4 text-xs text-gray-400 dark:text-gray-500">Or</span>
            <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
          </div>

          {/* Dynamic Alert Banner System */}
          {errorMessage && (
            <div className="w-full p-3 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm text-left flex items-start gap-2 animate-fade-in">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="w-full p-3 mb-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm text-left flex items-start gap-2 animate-fade-in">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Inputs */}
          <div className="w-full space-y-3 mb-4">
            
            {/* Full Name Input */}
            {!isLoginView && (
              <div className="relative animate-fade-in">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className={`w-5 h-5 transition-colors ${isNameValid ? 'text-emerald-500' : isNameInvalid ? 'text-red-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={getInputClasses(isNameValid, isNameInvalid)}
                />
                <StatusIcon isValid={isNameValid} isInvalid={isNameInvalid} />
              </div>
            )}

            {/* Email Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className={`w-5 h-5 transition-colors ${isEmailValid ? 'text-emerald-500' : isEmailInvalid ? 'text-red-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <input 
                type="email" 
                placeholder="Enter email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={getInputClasses(isEmailValid, isEmailInvalid)}
              />
              <StatusIcon isValid={isEmailValid} isInvalid={isEmailInvalid} />
            </div>

            {/* Password Input */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className={`w-5 h-5 transition-colors ${isPwdValid ? 'text-emerald-500' : isPwdInvalid ? 'text-red-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <input 
                  type="password" 
                  placeholder={isLoginView ? "Enter password" : "Create a password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={getInputClasses(isPwdValid, isPwdInvalid)}
                />
                <StatusIcon isValid={isPwdValid} isInvalid={isPwdInvalid} />
              </div>
              
              {/* Live Password Hint during Signup */}
              {!isLoginView && (
                <p className={`text-left text-[10px] mt-2 px-2 transition-colors ${isPwdValid ? 'text-emerald-500' : isPwdInvalid ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
                  {isPwdValid ? "✓ Strong password" : (pwdError || "Must contain 8+ chars, 1 uppercase, 1 number, & 1 special char.")}
                </p>
              )}
            </div>
            
            {/* Confirm Password Field */}
            {!isLoginView && (
              <div className="relative mt-3 animate-fade-in">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className={`w-5 h-5 transition-colors ${isConfirmPwdValid ? 'text-emerald-500' : isConfirmPwdInvalid ? 'text-red-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <input 
                  type="password" 
                  placeholder="Confirm password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={getInputClasses(isConfirmPwdValid, isConfirmPwdInvalid)}
                />
                <StatusIcon isValid={isConfirmPwdValid} isInvalid={isConfirmPwdInvalid} />
              </div>
            )}
          </div>

          <button 
            onClick={handleAuth}
            disabled={!isFormReadyToSubmit || isLoading}
            className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              isFormReadyToSubmit && !isLoading
                ? 'bg-cyan-600 text-white hover:bg-cyan-700 shadow-md shadow-cyan-500/20' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed mt-2'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Processing...
              </>
            ) : (
              isLoginView ? "Sign In" : "Create Account"
            )}
          </button>

          <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
            By logging in or signing up, I agree to SkyInnovators' <a href="#" className="underline hover:text-gray-900 dark:hover:text-white">Terms of Service</a>
          </p>
        </div>

        <div className="flex flex-col items-center text-xs text-gray-400 space-y-2 pb-4">
          <p>Copyright © 2025-2026 SkyInnovators</p>
        </div>
      </div>

      {/* RIGHT COLUMN: Visual Showcase */}
      <div className="hidden lg:flex w-[55%] bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-slate-900 dark:via-gray-900 dark:to-cyan-900/20 relative items-center justify-center overflow-hidden border-l border-gray-100 dark:border-gray-800 transition-colors duration-300">
        <div className="absolute top-8 right-8 flex items-center gap-4 z-20">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all flex items-center justify-center w-10 h-10"
          >
            {isDarkMode ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
          
          <select className="bg-white/80 dark:bg-gray-800/80 dark:text-white backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-sm font-medium rounded-full px-4 py-2 outline-none hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm cursor-pointer transition-all">
            <option>EN</option>
            <option>TR</option>
          </select>
        </div>

        <div className="relative w-full h-full flex items-center justify-center opacity-80">
          <div className="absolute w-[800px] h-[800px] border border-cyan-100 dark:border-cyan-500/10 rounded-full animate-pulse"></div>
          <div className="absolute w-[600px] h-[600px] border border-indigo-100 dark:border-indigo-500/10 rounded-full"></div>
          
          <div className="relative z-10 text-center space-y-6 max-w-md">
            <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-cyan-500/10 dark:shadow-cyan-500/5 mx-auto flex items-center justify-center border border-gray-100 dark:border-gray-700">
               <svg className="w-10 h-10 text-cyan-500 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">Precision AI for <br/> Aerial Intelligence</h2>
            <p className="text-gray-500 dark:text-gray-400">Upload telemetry and media to extract actionable insights in real-time.</p>
          </div>
        </div>
      </div>

    </div>
  );
}