import React from 'react';
import { Link } from 'react-router-dom';
import { ReactComponent as CalendarIcon } from '../logo.svg';
// Define icons manually to avoid lucide-react dependency issues for now


const Clock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12,6 12,12 16,14"></polyline>
  </svg>
);

const Users = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const Check = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <polyline points="20,6 9,17 4,12"></polyline>
  </svg>
);

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12,5 19,12 12,19"></polyline>
  </svg>
);

const Home = () => {
  const features = [
    {
      icon: <CalendarIcon className="w-6 h-6" />,
      title: "Easy Scheduling",
      description: "Set your availability and let others book time with you effortlessly."
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Time Zone Smart",
      description: "Automatically handles time zones so you never miss a meeting."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Google Calendar Sync",
      description: "Seamlessly integrates with your Google Calendar and includes Meet links."
    }
  ];

  const benefits = [
    "No more back-and-forth emails",
    "Automatic Google Calendar sync",
    "Built-in Google Meet integration",
    "Professional booking pages",
    "Email notifications for both parties"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md shadow-soft border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-lg">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900 ml-3">{process.env.REACT_APP_APP_NAME || "Sched"}</span>
            </div>
            <div className="flex items-center space-x-6">
              <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200">
                Sign In
              </Link>
              <Link to="/login" className="btn-primary">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center bg-primary-50 text-primary-700 rounded-full px-6 py-2 text-sm font-medium mb-8 animate-fade-in">
              ✨ Trusted by 10,000+ professionals worldwide
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-8 animate-fade-in leading-tight">
              Scheduling Made
              <span className="block bg-gradient-to-r from-primary-600 via-purple-600 to-primary-800 bg-clip-text text-transparent">
                Simple & Beautiful
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto animate-fade-in leading-relaxed">
              Stop the back-and-forth emails. Let people book time with you seamlessly using your personalized scheduling page with integrated Google Calendar.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in">
              <Link to="/login" className="btn-primary text-lg px-10 py-4 shadow-2xl">
                Start Scheduling Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <a href="#features" className="btn-secondary text-lg px-10 py-4">
                See How It Works
              </a>
            </div>
          </div>
        </div>
        
        {/* Enhanced background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/6 w-96 h-96 bg-gradient-to-r from-primary-200 to-purple-200 rounded-full opacity-30 blur-3xl animate-pulse-subtle"></div>
          <div className="absolute bottom-1/4 right-1/6 w-128 h-128 bg-gradient-to-r from-purple-200 to-primary-200 rounded-full opacity-25 blur-3xl animate-pulse-subtle"></div>
          <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-gradient-to-r from-primary-100 to-purple-100 rounded-full opacity-40 blur-2xl"></div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center bg-primary-50 text-primary-700 rounded-full px-4 py-2 text-sm font-medium mb-6">
              🚀 Powerful Features
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need to Schedule Better
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Powerful features designed to make scheduling effortless for everyone involved.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            {features.map((feature, index) => (
              <div key={index} className="card card-hover text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-lg">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gradient-to-br from-primary-50 via-purple-50 to-primary-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center bg-white/80 text-primary-700 rounded-full px-4 py-2 text-sm font-medium mb-6 shadow-soft">
                💼 Professional Grade
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
                Why Choose Sched?
              </h2>
              <p className="text-xl text-gray-700 mb-10 leading-relaxed">
                Join thousands of professionals who have streamlined their scheduling workflow with our intuitive platform.
              </p>
              <ul className="space-y-6">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center group">
                    <div className="flex-shrink-0 w-8 h-8 bg-success-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-success-200 transition-colors duration-200">
                      <Check className="w-4 h-4 text-success-600" />
                    </div>
                    <span className="text-gray-700 text-lg font-medium">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:text-center">
              <div className="card max-w-lg mx-auto transform lg:rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="calendar-gradient p-8 rounded-2xl text-white text-center mb-6 shadow-2xl">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-90" />
                  <h3 className="text-2xl font-bold mb-2">Your Booking Page</h3>
                  <p className="text-primary-100 text-lg">Beautiful, professional, and always available</p>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Create a personalized booking page that reflects your brand and makes it easy for others to schedule time with you.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 right-0 w-64 h-64 bg-gradient-to-l from-purple-200 to-transparent rounded-full opacity-50 blur-2xl"></div>
          <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-gradient-to-r from-primary-200 to-transparent rounded-full opacity-40 blur-3xl"></div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-gray-900 via-primary-900 to-gray-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Ready to Transform Your Scheduling?
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join professionals worldwide who have simplified their scheduling workflow with Sched.
          </p>
          <Link to="/login" className="btn-primary text-xl px-12 py-5 bg-white text-gray-900 hover:bg-gray-100 shadow-2xl">
            Get Started for Free
            <ArrowRight className="w-6 h-6 ml-3" />
          </Link>
        </div>
        
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500 rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-128 h-128 bg-purple-500 rounded-full opacity-10 blur-3xl"></div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center">
            <div className="p-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-lg mr-3">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">{process.env.REACT_APP_APP_NAME || "Sched"}</span>
            <span className="text-gray-500 ml-6">© 2024 All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home; 