import { Link } from "react-router-dom";
import { Briefcase, Mail, MapPin, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Briefcase className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">nextgig</span>
            </Link>
            <p className="text-background/70 text-sm leading-relaxed">
              Connect with skilled freelancers or find your next project. Secure payments, trusted escrow system.
            </p>
          </div>

          {/* For Clients */}
          <div className="space-y-4">
            <h4 className="font-semibold">For Clients</h4>
            <ul className="space-y-3 text-sm text-background/70">
              <li><Link to="/marketplace" className="hover:text-background transition-colors">Post a Task</Link></li>
              <li><Link to="/how-it-works" className="hover:text-background transition-colors">How It Works</Link></li>
              <li><Link to="/categories" className="hover:text-background transition-colors">Browse Categories</Link></li>
              <li><Link to="/trust-safety" className="hover:text-background transition-colors">Trust & Safety</Link></li>
            </ul>
          </div>

          {/* For Freelancers */}
          <div className="space-y-4">
            <h4 className="font-semibold">For Freelancers</h4>
            <ul className="space-y-3 text-sm text-background/70">
              <li><Link to="/marketplace" className="hover:text-background transition-colors">Find Work</Link></li>
              <li><Link to="/register" className="hover:text-background transition-colors">Create Profile</Link></li>
              <li><Link to="/payments" className="hover:text-background transition-colors">Get Paid</Link></li>
              <li><Link to="/resources" className="hover:text-background transition-colors">Resources</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold">Contact</h4>
            <ul className="space-y-3 text-sm text-background/70">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                support@nextgig.com
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                +1 (555) 123-4567
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                San Francisco, CA
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-background/50">
            © 2024 nextgig. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-background/50">
            <Link to="/terms" className="hover:text-background transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-background transition-colors">Privacy Policy</Link>
            <Link to="/contact" className="hover:text-background transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;