
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

      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
       
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
