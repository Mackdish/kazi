import { useState, useMemo } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MarketplaceTaskCard from "@/components/tasks/MarketplaceTaskCard";
import { useTasks, useCategories } from "@/hooks/useTasks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal, X } from "lucide-react";

const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [budgetRange, setBudgetRange] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [showFilters, setShowFilters] = useState(false);

  const { data: tasks = [], isLoading: tasksLoading } = useTasks("open");
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  const budgetRanges = [
    { value: "all", label: "All Budgets" },
    { value: "0-500", label: "Under $500" },
    { value: "500-1000", label: "$500 - $1,000" },
    { value: "1000-2500", label: "$1,000 - $2,500" },
    { value: "2500+", label: "$2,500+" },
  ];

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "budget-high", label: "Highest Budget" },
    { value: "budget-low", label: "Lowest Budget" },
    { value: "deadline", label: "Deadline" },
  ];

  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query) ||
          (task.category?.name?.toLowerCase().includes(query) ?? false)
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((task) => task.category?.name === selectedCategory);
    }

    // Budget filter
    if (budgetRange !== "all") {
      const [min, max] = budgetRange.split("-").map((v) => (v === "2500+" ? Infinity : parseInt(v)));
      filtered = filtered.filter((task) => {
        if (max === Infinity) return task.budget >= 2500;
        return task.budget >= (min || 0) && task.budget <= max;
      });
    }

    // Sort
    switch (sortBy) {
      case "budget-high":
        filtered.sort((a, b) => b.budget - a.budget);
        break;
      case "budget-low":
        filtered.sort((a, b) => a.budget - b.budget);
        break;
      case "deadline":
        filtered.sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });
        break;
      case "newest":
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return filtered;
  }, [tasks, searchQuery, selectedCategory, budgetRange, sortBy]);

  const activeFiltersCount = [
    selectedCategory !== "all",
    budgetRange !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedCategory("all");
    setBudgetRange("all");
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero */}
      <section className="gradient-hero py-12">
        <div className="container">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Task Marketplace
          </h1>
          <p className="text-primary-foreground/80 mb-6">
            Find your next project from thousands of opportunities
          </p>

          {/* Search Bar */}
          <div className="flex gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-0 h-12"
              />
            </div>
            <Button
              variant="outline"
              className="h-12 bg-card border-0 md:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-5 w-5" />
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </section>

      <div className="container py-8 flex-1">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className={`lg:w-64 shrink-0 ${showFilters ? "block" : "hidden lg:block"}`}>
            <div className="bg-card rounded-lg p-6 shadow-card sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold">Filters</h3>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                    Clear all
                  </Button>
                )}
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Budget Filter */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">Budget</label>
                <Select value={budgetRange} onValueChange={setBudgetRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Budgets" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetRanges.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quick Category Links */}
              <div>
                <label className="text-sm font-medium mb-3 block">Popular</label>
                <div className="flex flex-wrap gap-2">
                  {categories.slice(0, 5).map((cat) => (
                    <Badge
                      key={cat.id}
                      variant={selectedCategory === cat.name ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => setSelectedCategory(selectedCategory === cat.name ? "all" : cat.name)}
                    >
                      {cat.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Tasks Grid */}
          <main className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">{filteredTasks.length}</span> tasks found
              </p>
              <div className="flex items-center gap-3">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters */}
            {(selectedCategory !== "all" || budgetRange !== "all" || searchQuery) && (
              <div className="flex flex-wrap gap-2 mb-6">
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    "{searchQuery}"
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                  </Badge>
                )}
                {selectedCategory !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {selectedCategory}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategory("all")} />
                  </Badge>
                )}
                {budgetRange !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {budgetRanges.find((r) => r.value === budgetRange)?.label}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setBudgetRange("all")} />
                  </Badge>
                )}
              </div>
            )}

            {/* Tasks */}
            {tasksLoading || categoriesLoading ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-card rounded-lg p-6 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredTasks.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredTasks.map((task, index) => (
                  <div key={task.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                    <MarketplaceTaskCard task={task} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-card rounded-lg">
                <p className="text-muted-foreground mb-4">No tasks match your filters</p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Marketplace;