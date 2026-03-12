import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Building2,
  FileText,
  Calendar,
  BarChart3,
  Shield,
  Users,
  Clock,
  CheckCircle,
  ArrowRight,
  Layers,
  Sparkles,
  Globe,
} from "lucide-react";

const features = [
  {
    icon: Building2,
    title: "Multi-Tenant Workspaces",
    description:
      "Each organization gets an isolated workspace with its own data, roles, and departments.",
  },
  {
    icon: FileText,
    title: "Digital Outpass System",
    description:
      "Request and track outpass approvals digitally with QR verification at security gates.",
  },
  {
    icon: Calendar,
    title: "Meeting Scheduler",
    description:
      "Book appointments with staff, view availability in real-time, and manage schedules.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Comprehensive analytics for attendance, outpass frequency, and staff availability trends.",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description:
      "Fine-grained access control with Admin, Staff, Student, and Security roles per organization.",
  },
  {
    icon: Sparkles,
    title: "AI Organization Builder",
    description:
      "Describe your org structure in plain English and let AI generate departments, roles, and dashboards.",
  },
];

const useCases = [
  {
    icon: Globe,
    title: "Educational Institutions",
    description: "Manage staff availability, student outpasses, and campus security.",
  },
  {
    icon: Layers,
    title: "Corporate Offices",
    description: "Track employee presence, meeting rooms, and visitor management.",
  },
  {
    icon: Users,
    title: "Healthcare Facilities",
    description: "Coordinate staff shifts, department schedules, and access control.",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Building2 className="w-4 h-4" />
              <span className="text-sm font-medium">Multi-Tenant SaaS Platform</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 leading-tight">
              Your Organization,{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                Fully Managed
              </span>{" "}
              with StaffHub
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Create your workspace, define roles & departments, and manage staff availability,
              outpasses, meetings, and security — all from one platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button size="lg" className="gradient-primary text-primary-foreground px-8 gap-2">
                  Create Your Workspace
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/faq">
                <Button size="lg" variant="outline" className="px-8">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Everything Your Organization Needs
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A comprehensive SaaS platform for managing people, processes, and access control.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-card rounded-2xl p-6 shadow-card hover:shadow-elevated transition-shadow duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Built for Any Organization
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              StaffHub adapts to your industry with AI-powered organization setup.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {useCases.map((useCase, index) => (
              <div
                key={index}
                className="bg-card rounded-2xl p-6 shadow-card text-center"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary mx-auto mb-4 flex items-center justify-center">
                  <useCase.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-lg">{useCase.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="relative overflow-hidden rounded-3xl gradient-primary p-8 md:p-12">
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-primary-foreground/80 mb-6">
                Create your organization workspace in minutes. Set up departments, invite your
                team, and start managing everything from one dashboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/login">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="bg-background text-primary hover:bg-background/90 gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Start Free
                  </Button>
                </Link>
                <Link to="/faq">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    View FAQ
                  </Button>
                </Link>
              </div>
            </div>
            <div className="absolute right-0 bottom-0 opacity-10">
              <Building2 className="w-64 h-64" />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
