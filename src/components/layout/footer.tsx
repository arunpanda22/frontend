import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-[#1a2332] to-[#2d3748] border-t border-gray-600/30 shadow-lg backdrop-blur-sm">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <div className="text-[#FEC20A] text-sm font-medium tracking-wide">
              © {new Date().getFullYear()} Pace Pivot Private Limited. All rights
              reserved.
            </div>
            <div className="text-gray-400 text-xs mt-1">
              Empowering Amazon sellers with data-driven insights
            </div>
          </div>
          <div className="flex items-center space-x-8">
            <Link 
              href="/support" 
              className="text-[#FEC20A] hover:text-white transition-all duration-200 font-medium relative group"
            >
              <span className="relative z-10">Support</span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 to-yellow-400/0 group-hover:from-yellow-400/10 group-hover:to-yellow-400/10 rounded-lg transition-all duration-200 -z-10"></div>
            </Link>
            {/* <a href="#" className="text-yellow-400 hover:text-white transition-colors duration-200 font-medium">
              Privacy Policy
            </a>
            <a href="#" className="text-yellow-400 hover:text-white transition-colors duration-200 font-medium">
              Terms of Service
            </a> */}
          </div>
        </div>
        
        {/* Decorative bottom border */}
        <div className="mt-6 pt-6 border-t border-gray-600/20">
          <div className="flex justify-center">
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-[#FEC20A]/50 to-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

