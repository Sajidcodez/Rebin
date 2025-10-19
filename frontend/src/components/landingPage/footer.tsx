import { Icons } from "../ui/icons"
import { useLocation, useNavigate } from "react-router-dom"

export function Footer() {
  const location = useLocation()
  const navigate = useNavigate()
  const isSortingPage = location.pathname === '/sorting'
  const isAuthPage = ["/login", "/register", "/auth/callback"].includes(location.pathname)

  const handleNavClick = (href: string) => {
    if (location.pathname !== '/') {
      // If not on home page, navigate to home first
      navigate('/')
      // Wait for navigation to complete, then scroll
      setTimeout(() => {
        const element = document.querySelector(href)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    } else {
      // If already on home page, just scroll
      const element = document.querySelector(href)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <footer className={`border-t ${isSortingPage || isAuthPage ? 'bg-black border-gray-800' : 'bg-card/30 border-border'}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Icons.leaf className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className={`text-xl font-bold ${isSortingPage || isAuthPage ? 'text-white' : 'text-foreground'}`}>ReBin</span>
            </div>
            <p className={`text-sm leading-relaxed ${isSortingPage || isAuthPage ? 'text-gray-300' : 'text-muted-foreground'}`}>
              Making sustainable living simple through AI-powered waste sorting and environmental education.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className={`font-semibold mb-4 ${isSortingPage || isAuthPage ? 'text-white' : 'text-foreground'}`}>Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => handleNavClick('#home')}
                  className={`text-sm hover:text-primary transition-colors ${isSortingPage || isAuthPage ? 'text-gray-300' : 'text-muted-foreground'}`}
                >
                  Home
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavClick('#mission')}
                  className={`text-sm hover:text-primary transition-colors ${isSortingPage || isAuthPage ? 'text-gray-300' : 'text-muted-foreground'}`}
                >
                  Mission
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavClick('#features')}
                  className={`text-sm hover:text-primary transition-colors ${isSortingPage || isAuthPage ? 'text-gray-300' : 'text-muted-foreground'}`}
                >
                  Features
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavClick('#impact')}
                  className={`text-sm hover:text-primary transition-colors ${isSortingPage || isAuthPage ? 'text-gray-300' : 'text-muted-foreground'}`}
                >
                  Our Impact
                </button>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className={`font-semibold mb-4 ${isSortingPage || isAuthPage ? 'text-white' : 'text-foreground'}`}>Resources</h3>
            <ul className="space-y-2">
              <li>
                <a href="https://portal.311.nyc.gov/article/?kanumber=KA-02013" className={`text-sm hover:text-primary transition-colors ${isSortingPage || isAuthPage ? 'text-gray-300' : 'text-muted-foreground'}`}>
                  Recycling Guide
                </a>
              </li>
              <li>
                <a href="https://www.epa.gov/recycle/composting-home" className={`text-sm hover:text-primary transition-colors ${isSortingPage || isAuthPage ? 'text-gray-300' : 'text-muted-foreground'}`}>
                  Composting Tips
                </a>
              </li>
              <li>
                <a href="https://cleanriver.com/resource/blog-what-can-i-do-to-help-recycling/" className={`text-sm hover:text-primary transition-colors ${isSortingPage || isAuthPage ? 'text-gray-300' : 'text-muted-foreground'}`}>
                  How to recycle
                </a>
              </li>
              <li>
                <a href="https://www.epa.gov/recycle/recycling-basics-and-benefits" className={`text-sm hover:text-primary transition-colors ${isSortingPage || isAuthPage ? 'text-gray-300' : 'text-muted-foreground'}`}>
                  Benefits of recycling
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className={`font-semibold mb-4 ${isSortingPage || isAuthPage ? 'text-white' : 'text-foreground'}`}>Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Icons.mail className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className={`text-sm ${isSortingPage || isAuthPage ? 'text-gray-300' : 'text-muted-foreground'}`}>"link wil be provided soon"</span>
              </li>
              <li className="flex items-start gap-2">
                <Icons.phone className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className={`text-sm ${isSortingPage || isAuthPage ? 'text-gray-300' : 'text-muted-foreground'}`}>+1 (910) 420-6967</span>
              </li>
              <li className="flex items-start gap-2">
                <Icons.mapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className={`text-sm ${isSortingPage || isAuthPage ? 'text-gray-300' : 'text-muted-foreground'}`}>Zoo york, New York</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={`pt-8 border-t ${isSortingPage || isAuthPage ? 'border-gray-800' : 'border-border'}`}>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className={`text-sm ${isSortingPage || isAuthPage ? 'text-gray-300' : 'text-muted-foreground'}`}>© {new Date().getFullYear()} ReBin. All rights reserved.</p>
            <div className="flex gap-6">
              <a className={`text-sm hover:text-primary transition-colors ${isSortingPage || isAuthPage ? 'text-gray-300' : 'text-muted-foreground'}`}>
                Join the community and lets make a difference together
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
