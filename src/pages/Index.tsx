import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TaskCard from "@/components/tasks/TaskCard";
import { mockTasks, categories } from "@/lib/mockData";
import { 
  ArrowRight, 
  Shield, 
  Zap, 
  Wallet, 
  CheckCircle2,
  Users,
  Briefcase,
  Star
} from "lucide-react";

const Index = () => {
  const featuredTasks = mockTasks.slice(0, 3);

  const stats = [
    { value: "50K+", label: "Freelancers" },
    { value: "25K+", label: "Tasks Posted" },
    { value: "$10M+", label: "Paid Out" },
    { value: "4.9", label: "Avg Rating" },
  ];

  const howItWorks = [
    {
      step: 1,
      title: "Post Your Task",
      description: "Describe your project, set a budget, and post it to our marketplace.",
      icon: Briefcase,
    },
    {
      step: 2,
      title: "Receive Bids",
      description: "Skilled freelancers will submit proposals. Compare and select the best fit.",
      icon: Users,
    },
    {
      step: 3,
      title: "Secure Payment",
      description: "Pay into our escrow system. Funds are held safely until work is approved.",
      icon: Shield,
    },
    {
      step: 4,
      title: "Get It Done",
      description: "Approve the work and release payment. Simple, secure, and hassle-free.",
      icon: CheckCircle2,
    },
  ];

  const features = [
    {
      icon: Shield,
      title: "Escrow Protection",
      description: "Your payment is held securely until you approve the completed work.",
    },
    {
      icon: Zap,
      title: "Fast & Easy",
      description: "Post tasks in minutes and receive bids from verified freelancers quickly.",
    },
    {
      icon: Wallet,
      title: "Flexible Payments",
      description: "Pay with Stripe or M-Pesa. Freelancers can withdraw to their preferred method.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="relative gradient-hero py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 leading-tight animate-fade-in">
              Get Work Done by <br className="hidden sm:block" />
              <span className="text-accent">Top Freelancers</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Connect with skilled professionals for any project. Secure payments, 
              trusted escrow, and quality guaranteed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <Link to="/register?role=client">
                <Button size="lg" className="w-full sm:w-auto bg-card text-foreground hover:bg-card/90 gap-2">
                  Post a Task
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/register?role=freelancer">
                <Button size="lg" className="gradient-hero border-0 w-full sm:w-auto gap-2">
                  Find Work
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div 
                key={stat.label} 
                className="text-center animate-fade-in"
                style={{ animationDelay: `${0.3 + index * 0.1}s` }}
              >
                <div className="text-3xl md:text-4xl font-bold text-primary-foreground">{stat.value}</div>
                <div className="text-primary-foreground/60 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={feature.title} className="border-0 shadow-card animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-xl gradient-hero flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get your project completed in four simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <div key={item.step} className="relative text-center animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/30 to-transparent"></div>
                )}
                <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-full gradient-hero mb-4">
                  <item.icon className="h-7 w-7 text-primary-foreground" />
                  <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Browse Categories</h2>
            <p className="text-muted-foreground">Find work in your area of expertise</p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category, index) => (
              <Link key={category} to={`/marketplace?category=${encodeURIComponent(category)}`}>
                <Button 
                  variant="outline" 
                  className="animate-fade-in hover:bg-primary hover:text-primary-foreground transition-all"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {category}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tasks */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Featured Tasks</h2>
              <p className="text-muted-foreground">Top opportunities available now</p>
            </div>
            <Link to="/marketplace">
              <Button variant="outline" className="gap-2 hidden sm:flex">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTasks.map((task, index) => (
              <div key={task.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <TaskCard task={task} />
              </div>
            ))}
          </div>

          <div className="text-center mt-8 sm:hidden">
            <Link to="/marketplace">
              <Button className="gap-2">
                View All Tasks <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 gradient-hero">
        <div className="container text-center">
          <div className="max-w-2xl mx-auto">
            <Star className="h-12 w-12 text-accent mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-primary-foreground/80 mb-8">
              Join thousands of clients and freelancers already using TaskFlow to get work done.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto bg-card text-foreground hover:bg-card/90">
                  Create Free Account
                </Button>
              </Link>
              <Link to="/marketplace">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  Browse Tasks
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;