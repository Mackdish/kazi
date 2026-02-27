import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Zap, Award, Globe, Target, Heart } from "lucide-react";

const About = () => {
  const values = [
    {
      icon: Shield,
      title: "Trust & Security",
      description: "Your payments are protected through our secure escrow system. Work with confidence knowing your money is safe.",
    },
    {
      icon: Zap,
      title: "Speed & Efficiency",
      description: "Find the right talent quickly. Our streamlined process gets your project started within hours, not days.",
    },
    {
      icon: Award,
      title: "Quality First",
      description: "We vet our freelancers to ensure you work with skilled professionals who deliver exceptional results.",
    },
    {
      icon: Globe,
      title: "Global Talent",
      description: "Access a worldwide pool of talented professionals. Find the perfect match regardless of location.",
    },
    {
      icon: Target,
      title: "Fair Pricing",
      description: "Competitive bidding ensures you get the best value. Set your budget and let freelancers compete for your work.",
    },
    {
      icon: Heart,
      title: "Support",
      description: "Our dedicated support team is here to help. Get assistance whenever you need it, 24/7.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="gradient-hero py-20">
        <div className="container text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">About nextgig</h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Connecting talented freelancers with clients who need quality work done
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              nextgig was built to bridge the gap between talented freelancers and clients 
              who need quality work. We believe everyone deserves access to opportunity, 
              regardless of where they are in the world. Our platform makes it easy to 
              find, hire, and pay skilled professionals securely.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value) => (
              <Card key={value.title} className="border-0 shadow-card">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-xl gradient-hero flex items-center justify-center mb-4">
                    <value.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                  <p className="text-muted-foreground text-sm">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">50K+</div>
              <p className="text-muted-foreground">Freelancers</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">25K+</div>
              <p className="text-muted-foreground">Tasks Completed</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">$10M+</div>
              <p className="text-muted-foreground">Paid to Freelancers</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">100+</div>
              <p className="text-muted-foreground">Countries</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;