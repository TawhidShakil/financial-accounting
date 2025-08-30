"use client";

import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import React, { useRef, useState } from "react";
import { auth } from "../firebase/firebase.init";
import { Link, useNavigate } from "react-router-dom";

function Signin() {
  const navigate = useNavigate();
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const togglePassword = () => {
    setPasswordVisible(!passwordVisible);
  };

  const [success, setSuccess] = useState(false)
  const [loginError, setLoginError] = useState('');
  const emailRef = useRef();

  const handleSubmit = (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    console.log(email,password)
    

    //reset status
    setSuccess(false)
    setLoginError('');
    //login user
    signInWithEmailAndPassword(auth,email,password)
    .then(result => {
      console.log(result.user)
      setSuccess(true) //remove this if you use verification
      navigate('/journal');

    //fored to stop unauthorized user
    // if(!result.user.emailVerified){
    //   setLoginError('Please Verify Your Email Address')
    // }
    // else{
    //   setSuccess(true)
    // }
      
    })

    .catch(error => {
      console.log('ERROR',error.message);
      setLoginError(error.message)
    })

    //old one
    // createUserWithEmailAndPassword(auth,email,password)
    // .then(result =>{
    //   console.log(result.user);
    // })
    // .catch(error => {
    //   console.log('ERROR', error);
    // })
  };

 const handleForgetPassword = () => {
  console.log('Get me email address', emailRef.current.value);
  const email =emailRef.current.value;

  if((!email)){
    console.log('Please Provide a Valid Email Address')
  }
  else{
    sendPasswordResetEmail(auth,email)
    .then(() => {
      alert('Password Reset Email Sent')
    })
    
  }

 }

  return (
    <div className="flex items-center justify-center p-4">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] bg-white p-6 rounded-lg shadow-lg">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-gray-500">
            Enter your email below to sign in to your account
          </p>
        </div>

        <div className="grid gap-6">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label
                  className="text-sm font-medium leading-none"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
                  id="email" name='email'
                  placeholder="name@example.com"
                  required
                  type="email" 
                  ref={emailRef}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <label
                    className="text-sm font-medium leading-none"
                    htmlFor="password" name='password'
                  >
                    Password
                  </label>
                  <a
                    href="#" onClick={handleForgetPassword}
                    className="ml-auto inline-block text-sm underline text-gray-500 hover:text-gray-900"
                  >
                    Forgot your password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
                    id="password"
                    required
                    type={passwordVisible ? "text" : "password"}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <i
                      className={`fas ${
                        passwordVisible ? "fa-eye" : "fa-eye-slash"
                      } text-gray-400 cursor-pointer`}
                      onClick={togglePassword}
                    ></i>
                  </div>
                </div>
              </div>

              <button className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 h-10 px-4 py-2 w-full">
                Sign In
              </button>
            </div>
          </form>
          
          {
            success && <p className="text-green-700">User Login Successfully</p>
          }

          {
            loginError && <p className="text-red-700">{loginError}</p>
          }
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 h-10 px-4 py-2 w-full"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                ></path>
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.42-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                ></path>
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                ></path>
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                ></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
              Google
            </button>

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 h-10 px-4 py-2 w-full"
            >
              <i className="fab fa-github mr-2 h-4 w-4"></i>
              GitHub
            </button>
          </div>
        </div>



        <p className="px-8 text-center text-sm text-muted-foreground">
  Don&apos;t have an account?{" "}
  <Link to="/signup" className="underline underline-offset-4 hover:text-primary">
    Sign up
  </Link>
</p>




      </div>
    </div>
  );
}

export default Signin;