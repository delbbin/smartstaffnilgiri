import { Link } from "react-router-dom";
import { Building2, Mail, Globe } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl">StaffHub</span>
            </div>
            <p className="text-muted-foreground mb-4 max-w-md">
              Campus management platform for staff availability, outpass management,
              meeting scheduling, and analytics.
            </p>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>support@staffhub.app</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span>staffhub.app</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link></li>
              <li><Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">Login</Link></li>
              <li><Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</Link></li>
              <li><Link to="/feedback" className="text-muted-foreground hover:text-foreground transition-colors">Feedback</Link></li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>Staff Availability Tracking</li>
              <li>Outpass Management</li>
              <li>Meeting Scheduler</li>
              <li>Analytics & Reports</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} StaffHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
