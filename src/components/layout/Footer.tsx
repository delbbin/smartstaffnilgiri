import { Link } from "react-router-dom";
import { GraduationCap, Mail, Phone, MapPin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl">SmartStaff</span>
            </div>
            <p className="text-muted-foreground mb-4 max-w-md">
              Smart Staff Availability, Outpass, Meeting and Presence Analysis System for 
              efficient campus management.
            </p>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>support@smartstaff.edu</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+91 123 456 7890</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Department of Computer Science</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/feedback" className="text-muted-foreground hover:text-foreground transition-colors">
                  Feedback
                </Link>
              </li>
            </ul>
          </div>

          {/* Staff */}
          <div>
            <h4 className="font-semibold mb-4">Our Staff</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>Dr. Archana (HOD)</li>
              <li>Miss Pavithra</li>
              <li>Miss Jima</li>
              <li>Miss Anusree</li>
              <li>Dr. Renjith</li>
              <li>Miss SreeDhanya</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} SmartStaff. All rights reserved. Department of Computer Science.</p>
        </div>
      </div>
    </footer>
  );
};
