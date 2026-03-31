import LivePreview from "@/components/LivePreview";
import LandingHeader from "@/components/LandingHeader";

export default function LandingPage() {
  const handleSignIn = () => {
    // Navigate to sign in page
    window.location.href = "/auth";
  };

  const handleGetStarted = () => {
    // Navigate to registration page
    window.location.href = "/auth";
  };

  return (
    <div className="min-h-screen bg-landing-bg-light">
      {/* Header */}
      <LandingHeader onSignIn={handleSignIn} onGetStarted={handleGetStarted} />

      {/* Hero Section with Live Preview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <LivePreview />
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Features that <span className="text-landing-accent">empower</span> your career
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to succeed in your placement journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-landing-primary-dark text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Smart Matching</h3>
              <p className="text-gray-600">AI-powered algorithm matches you with the best opportunities based on your profile</p>
            </div>

            <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-landing-primary-dark text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Analytics Dashboard</h3>
              <p className="text-gray-600">Track your progress with detailed analytics and insights</p>
            </div>

            <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-landing-primary-dark text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Resume Builder</h3>
              <p className="text-gray-600">Create professional resumes with our AI-powered builder</p>
            </div>

            <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-landing-primary-dark text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Network</h3>
              <p className="text-gray-600">Connect with opportunities and build your career</p>
            </div>

            <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-landing-primary-dark text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Real-time Updates</h3>
              <p className="text-gray-600">Get instant notifications about new opportunities</p>
            </div>

            <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-landing-primary-dark text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Secure & Private</h3>
              <p className="text-gray-600">Your data is secure with enterprise-grade security</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 bg-landing-bg-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              How <span className="text-landing-accent">UniPlacement</span> works
            </h2>
            <p className="text-lg text-gray-600">
              Get started in 4 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-landing-accent text-landing-primary-dark rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Sign Up</h3>
              <p className="text-gray-600">Create your account with your college credentials</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-landing-accent text-landing-primary-dark rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Complete Profile</h3>
              <p className="text-gray-600">Fill in your academic and personal details</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-landing-accent text-landing-primary-dark rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Upload Resume</h3>
              <p className="text-gray-600">Upload your resume and get AI-powered suggestions</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-landing-accent text-landing-primary-dark rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                4
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Apply & Track</h3>
              <p className="text-gray-600">Apply to drives and track your applications</p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-landing-primary-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Trusted by <span className="text-landing-accent">thousands</span> of students
            </h2>
            <p className="text-lg text-gray-300">
              Join the platform of successful placements
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-landing-accent mb-2">5000+</div>
              <p className="text-gray-300">Students Placed</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-landing-accent mb-2">100+</div>
              <p className="text-gray-300">Company Partners</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-landing-accent mb-2">95%</div>
              <p className="text-gray-300">Placement Rate</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-landing-accent mb-2">8.5L</div>
              <p className="text-gray-300">Average Package</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-landing-accent text-landing-primary-dark rounded flex items-center justify-center font-bold text-sm">
                  M
                </div>
                <div>
                  <h3 className="text-xl font-bold">UniPlacement</h3>
                  <p className="text-xs text-gray-400">MITS GWALIOR - T&P CELL</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Empowering students to achieve their career dreams
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white">How It Works</a></li>
                <li><a href="#about" className="hover:text-white">About Us</a></li>
                <li><a href="#contact" className="hover:text-white">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#resume-tips" className="hover:text-white">Resume Tips</a></li>
                <li><a href="#interview-guide" className="hover:text-white">Interview Guide</a></li>
                <li><a href="#blog" className="hover:text-white">Blog</a></li>
                <li><a href="#faq" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>MITS Gwalior</li>
                <li>T&P Cell</li>
                <li>placement@mitsgwalior.in</li>
                <li>+91-1234567890</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 UniPlacement. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
