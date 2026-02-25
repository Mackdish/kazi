import { Task } from "@/components/tasks/TaskCard";

export const categories = [
  "Web Development",
  "Mobile Development",
  "UI/UX Design",
  "Content Writing",
  "Digital Marketing",
  "Data Entry",
  "Video Editing",
  "Graphic Design",
  "Virtual Assistant",
  "Translation",
];

export const mockTasks: Task[] = [
  {
    id: "1",
    title: "Build a Modern E-commerce Website with React",
    description: "Looking for an experienced React developer to build a fully functional e-commerce platform with payment integration, user authentication, and admin dashboard.",
    category: "Web Development",
    budget: 2500,
    deadline: "2024-02-15",
    status: "open",
    clientName: "TechCorp Inc.",
    bidsCount: 12,
    createdAt: "2024-01-20",
  },
  {
    id: "2",
    title: "Design Mobile App UI for Fitness Tracking",
    description: "Need a creative UI/UX designer to create modern, user-friendly interfaces for our fitness tracking mobile application. Must include workout tracking, progress charts, and social features.",
    category: "UI/UX Design",
    budget: 1200,
    deadline: "2024-02-10",
    status: "open",
    clientName: "FitLife Studios",
    bidsCount: 8,
    createdAt: "2024-01-22",
  },
  {
    id: "3",
    title: "Write SEO-Optimized Blog Articles",
    description: "Seeking a skilled content writer to produce 10 high-quality, SEO-optimized blog articles for our tech startup. Topics include AI, cloud computing, and digital transformation.",
    category: "Content Writing",
    budget: 800,
    deadline: "2024-02-20",
    status: "in_progress",
    clientName: "CloudTech Solutions",
    bidsCount: 15,
    createdAt: "2024-01-18",
  },
  {
    id: "4",
    title: "Develop Cross-Platform Mobile App",
    description: "Looking for a React Native developer to build a cross-platform mobile app for food delivery service. Must include real-time tracking, payment integration, and push notifications.",
    category: "Mobile Development",
    budget: 4000,
    deadline: "2024-03-01",
    status: "open",
    clientName: "FoodieExpress",
    bidsCount: 6,
    createdAt: "2024-01-25",
  },
  {
    id: "5",
    title: "Create Marketing Video for Product Launch",
    description: "Need a professional video editor to create a 2-minute promotional video for our new product launch. Must include motion graphics, voice-over sync, and color grading.",
    category: "Video Editing",
    budget: 600,
    deadline: "2024-02-05",
    status: "escrow",
    clientName: "InnovateTech",
    bidsCount: 10,
    createdAt: "2024-01-15",
  },
  {
    id: "6",
    title: "Data Entry and Spreadsheet Management",
    description: "Require assistance with data entry tasks including transferring data from PDF documents to Excel spreadsheets. Accuracy and attention to detail is essential.",
    category: "Data Entry",
    budget: 300,
    deadline: "2024-02-08",
    status: "completed",
    clientName: "DataFirst Corp",
    bidsCount: 20,
    createdAt: "2024-01-10",
  },
];

export interface Bid {
  id: string;
  taskId: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAvatar: string;
  amount: number;
  proposal: string;
  rating: number;
  completedJobs: number;
  createdAt: string;
}

export const mockBids: Bid[] = [
  {
    id: "b1",
    taskId: "1",
    freelancerId: "f1",
    freelancerName: "Alex Johnson",
    freelancerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    amount: 2200,
    proposal: "I have 5+ years of experience building e-commerce platforms with React and have delivered similar projects for major clients. I can complete this within 3 weeks with all features requested.",
    rating: 4.9,
    completedJobs: 47,
    createdAt: "2024-01-21",
  },
  {
    id: "b2",
    taskId: "1",
    freelancerId: "f2",
    freelancerName: "Sarah Chen",
    freelancerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    amount: 2400,
    proposal: "Senior full-stack developer with expertise in React, Node.js, and payment integrations. I've built over 20 e-commerce sites and can deliver a production-ready solution.",
    rating: 4.8,
    completedJobs: 62,
    createdAt: "2024-01-21",
  },
  {
    id: "b3",
    taskId: "1",
    freelancerId: "f3",
    freelancerName: "Mike Williams",
    freelancerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
    amount: 2100,
    proposal: "I specialize in modern e-commerce solutions and have extensive experience with Stripe payments. Ready to start immediately and deliver high-quality work.",
    rating: 4.7,
    completedJobs: 35,
    createdAt: "2024-01-22",
  },
];

export interface User {
  id: string;
  name: string;
  email: string;
  role: "client" | "freelancer" | "admin";
  avatar: string;
  bio?: string;
  skills?: string[];
  rating?: number;
  completedJobs?: number;
  walletBalance?: number;
  pendingBalance?: number;
}

export const mockUser: User = {
  id: "u1",
  name: "John Doe",
  email: "john@example.com",
  role: "freelancer",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
  bio: "Senior full-stack developer with 8+ years of experience in web and mobile development.",
  skills: ["React", "Node.js", "TypeScript", "Python", "AWS"],
  rating: 4.9,
  completedJobs: 124,
  walletBalance: 4250,
  pendingBalance: 1200,
};