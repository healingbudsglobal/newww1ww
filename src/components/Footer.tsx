import hbLogoWhite from "@/assets/hb-logo-white-new.png";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer id="contact" className="bg-gradient-to-br from-[#1F2A25] to-[#13303D] text-white py-12 sm:py-16">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 md:gap-12 mb-8 sm:mb-12">
          <div>
            <div className="mb-4">
              <Link to="/">
                <img 
                  src={hbLogoWhite} 
                  alt="Healing Buds Logo" 
                  className="h-8 sm:h-10 w-auto object-contain hover:opacity-80 transition-opacity"
                />
              </Link>
            </div>
            <p className="font-body text-white/70 text-sm sm:text-base leading-relaxed">
              Shaping the future of cannabis through research and excellence.
            </p>
          </div>

          <div>
            <h4 className="font-pharma font-semibold text-base sm:text-lg mb-3 sm:mb-4">Company</h4>
            <ul className="space-y-2 text-sm sm:text-base font-body">
              <li>
                <Link to="/about-us" className="text-white/70 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/what-we-do" className="text-white/70 hover:text-white transition-colors">
                  Our Standards
                </Link>
              </li>
              <li>
                <Link to="/research" className="text-white/70 hover:text-white transition-colors">
                  Research
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-pharma font-semibold text-base sm:text-lg mb-3 sm:mb-4">Resources</h4>
            <ul className="space-y-2 text-sm sm:text-base font-body">
              <li>
                <Link to="/contact" className="text-white/70 hover:text-white transition-colors">
                  Patient Access
                </Link>
              </li>
              <li>
                <Link to="/research" className="text-white/70 hover:text-white transition-colors">
                  Healthcare Professionals
                </Link>
              </li>
              <li>
                <Link to="/#news" className="text-white/70 hover:text-white transition-colors">
                  News & Updates
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-pharma font-semibold text-base sm:text-lg mb-3 sm:mb-4">Contact</h4>
            <ul className="space-y-2 text-sm sm:text-base font-body">
              <li className="text-white/70">
                Healing Buds Global<br />
                Av. Fco. Sá Carneiro<br />
                Edf. Golfinho<br />
                Lj. 3, Quarteira<br />
                Faro<br />
                812 5148<br />
                Portugal
              </li>
              <li>
                <a href="mailto:info@healingbuds.com" className="text-white/70 hover:text-white transition-colors">
                  info@healingbuds.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 pt-6 sm:pt-8 text-center text-white/70 text-sm sm:text-base">
          <p>&copy; 2025 Healing Buds. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
