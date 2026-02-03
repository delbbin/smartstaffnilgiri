import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  GraduationCap,
  FileText,
  Calendar,
  BarChart3,
  Shield,
  Users,
  Clock,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Digital Outpass",
    description:
      "Request and track outpass approvals online. No more paper forms or waiting in queues.",
  },
  {
    icon: Calendar,
    title: "Meeting Scheduler",
    description:
      "Book appointments with tutors for notebook signing, no-due certificates, and consultations.",
  },
  {
    icon: BarChart3,
    title: "Availability Analytics",
    description:
      "View real-time staff availability graphs to find the best time for your meetings.",
  },
  {
    icon: Shield,
    title: "HOD Approval",
    description:
      "Secure digital approval system with Dr. Archana Mam's authorization for outpasses.",
  },
  {
    icon: Users,
    title: "Staff Directory",
    description:
      "Access complete information about all department tutors and their availability schedules.",
  },
  {
    icon: Clock,
    title: "Real-time Tracking",
    description:
      "Track your requests in real-time and get instant notifications on status updates.",
  },
];

const staffMembers = [
  { name: "Dr. Archana", role: "Head of Department", isHod: true },
  { name: "Miss Pavithra", role: "Assistant Professor", isHod: false },
  { name: "Miss Jima", role: "Assistant Professor", isHod: false },
  { name: "Miss Anusree", role: "Assistant Professor", isHod: false },
  { name: "Dr. Renjith", role: "Associate Professor", isHod: false },
  { name: "Miss SreeDhanya", role: "Assistant Professor", isHod: false },
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
              <GraduationCap className="w-4 h-4" />
              <span className="text-sm font-medium">Department of Computer Science</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 leading-tight">
              Smart Staff{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                Availability
              </span>{" "}
              & Outpass System
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Streamline your campus experience with digital outpass requests, meeting
              scheduling, and real-time staff availability tracking.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button size="lg" className="gradient-primary text-primary-foreground px-8 gap-2">
                  Get Started
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
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A comprehensive solution for managing staff-student interactions and campus
              movement.
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

      {/* Staff Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Our Faculty
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Meet the dedicated team of Computer Science department.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {staffMembers.map((staff, index) => (
              <div
                key={index}
                className={`relative bg-card rounded-2xl p-6 shadow-card text-center ${
                  staff.isHod ? "ring-2 ring-primary" : ""
                }`}
              >
                {staff.isHod && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                    HOD
                  </div>
                )}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-foreground">
                    {staff.name.charAt(0)}
                  </span>
                </div>
                <h3 className="font-semibold text-lg">{staff.name}</h3>
                <p className="text-sm text-muted-foreground">{staff.role}</p>
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
                Join our digital campus management system today. Request outpasses, schedule
                meetings, and stay connected with your tutors.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/login">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="bg-white text-primary hover:bg-white/90 gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Login Now
                  </Button>
                </Link>
                <Link to="/faq">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-primary-foreground hover:bg-white/10"
                  >
                    View FAQ
                  </Button>
                </Link>
              </div>
            </div>
            <div className="absolute right-0 bottom-0 opacity-10">
              <GraduationCap className="w-64 h-64" />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
