import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, DollarSign, Users, CheckCircle2, Briefcase, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HowItWorks = () => {
  const clientSteps = [
    {
      step: 1,
      title: "Post Your Task",
      description: "Describe your project, set a budget and deadline. Be as detailed as possible to attract the right talent.",
    },
    {
      step: 2,
      title: "Receive Bids",
      description: "Skilled freelancers will submit proposals with their rates and approach. Review profiles and ratings.",
    },
    {
      step: 3,
      title: "Hire & Pay",
      description: "Accept the best bid and pay into escrow. Your payment is held securely until work is approved.",
    },
    {
      step: 4,
      title: "Review & Release",
      description: "Review the completed work. Once approved, payment is released to the freelancer automatically.",
    },
  ];

  const freelancerSteps = [
    {
      step: 1,
      title: "Create Profile",
      description: "Build a compelling profile showcasing your skills, experience, and portfolio.",
    },
    {
      step: 2,
      title: "Find Tasks",
      description: "Browse available tasks and filter by category, budget, and skills. Find projects that match your expertise.",
    },
    {
      step: 3,
      title: "Submit Bids",
      description: "Write a compelling proposal explaining why you're the best fit. Set your price and timeline.",
    },
    {
      step: 4,
      title: "Get Paid",
      description: "Complete the work and submit for approval. Once approved, withdraw funds via Stripe or M-Pesa.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="gradient-hero py-20">
        <div className="container text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">How It Works</h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Get started in minutes with our simple, secure process
          </p>
        </div>
      </section>

      {/* For Clients */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Briefcase className="h-4 w-4" />
              For Clients
            </div>
            <h2 className="text-3xl font-bold">Hire Top Talent</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {clientSteps.map((item, index) => (
              <div key={item.step} className="relative">
                {index < clientSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/30 to-transparent"></div>
                )}
                <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-full gradient-hero mb-4">
                  <span className="text-2xl font-bold text-primary-foreground">{item.step}</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/register?role=client">
              <Button className="gradient-hero border-0 gap-2">
                Post Your First Task <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* For Freelancers */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="container">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full mb-4">
              <Users className="h-4 w-4" />
              For Freelancers
            </div>
            <h2 className="text-3xl font-bold">Find Great Work</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {freelancerSteps.map((item, index) => (
              <div key={item.step} className="relative">
                {index < freelancerSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-accent/30 to-transparent"></div>
                )}
                <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-full gradient-accent mb-4">
                  <span className="text-2xl font-bold text-accent-foreground">{item.step}</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/register?role=freelancer">
              <Button className="gradient-accent border-0 gap-2">
                Start Freelancing <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Escrow Explanation */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">Secure Escrow Payments</h2>
              <p className="text-muted-foreground">
                Our escrow system protects both clients and freelancers
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Payment Held</h3>
                  <p className="text-sm text-muted-foreground">
                    When you accept a bid, payment is held securely in escrow
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="h-6 w-6 text-warning" />
                  </div>
                  <h3 className="font-semibold mb-2">Work Completed</h3>
                  <p className="text-sm text-muted-foreground">
                    Freelancer completes the work and submits for review
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-2">Payment Released</h3>
                  <p className="text-sm text-muted-foreground">
                    Approve the work and payment is released instantly
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowItWorks;