import { useState, useMemo } from "react";
import { useAdminFreelancers, useAdminClients, useSuspendUser } from "@/hooks/useAdminTaskManagement";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, UserCheck, UserX, Award, Star } from "lucide-react";

const ClientFreelancerManagement = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: freelancers, isLoading: freelancersLoading, error: freelancersError } = useAdminFreelancers();
  const { data: clients, isLoading: clientsLoading, error: clientsError } = useAdminClients();
  const suspendUser = useSuspendUser();

  const getErrorMessage = (err: unknown): string => {
    if (!err) return "Unknown error occurred";
    
    // Handle Error objects
    if (err instanceof Error) {
      return err.message;
    }
    
    // Handle objects with message property
    if (typeof err === "object" && "message" in err) {
      return String((err as any).message);
    }
    
    // Fallback to string conversion
    return String(err);
  };

  const filteredFreelancers = useMemo(() => {
    if (!freelancers) return [];
    return freelancers.filter((f) =>
      f.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.bio?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [freelancers, searchQuery]);

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter((c) =>
      c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.bio?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [clients, searchQuery]);

  const handleSuspendUser = async (userId: string) => {
    try {
      await suspendUser.mutateAsync(userId);
      toast({
        title: "Success",
        description: "User account has been suspended",
      });
    } catch (err) {
      console.error("Failed to suspend user:", err);
      toast({
        title: "Error",
        description: "Failed to suspend user. Make sure you have admin access.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div>
          <h2 className="text-xl font-semibold">User Management</h2>
          <p className="text-sm text-muted-foreground">Manage freelancers and clients on the platform</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
      </div>

      <Tabs defaultValue="freelancers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="freelancers" className="gap-2">
            <Award className="h-4 w-4" />
            Freelancers
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-2">
            <UserCheck className="h-4 w-4" />
            Clients
          </TabsTrigger>
        </TabsList>

        {/* Freelancers Tab */}
        <TabsContent value="freelancers" className="space-y-4">
          {freelancersError ? (
            <Card className="border-destructive">
              <CardContent className="pt-6 space-y-2">
                <p className="text-destructive font-semibold">Error loading freelancers</p>
                <p className="text-destructive text-sm">{getErrorMessage(freelancersError)}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Total Freelancers: {freelancers?.length || 0}
                </p>
              </div>

              {freelancersLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="h-6 w-2/3 bg-muted animate-pulse rounded" />
                          <div className="h-4 w-full bg-muted animate-pulse rounded" />
                          <div className="flex gap-2">
                            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
                            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredFreelancers.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    <Award className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No freelancers found</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredFreelancers.map((freelancer) => (
                    <Card key={freelancer.user_id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4 flex-1">
                        {freelancer.avatar_url ? (
                          <img
                            src={freelancer.avatar_url}
                            alt={freelancer.full_name || "User"}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold">
                            {freelancer.full_name?.[0] || "F"}
                          </div>
                        )}

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{freelancer.full_name || "Unknown"}</h3>
                            <Badge variant="secondary">Freelancer</Badge>
                          </div>
                          {freelancer.bio && (
                            <p className="text-sm text-muted-foreground">{freelancer.bio}</p>
                          )}
                          {freelancer.skills && freelancer.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {freelancer.skills.slice(0, 5).map((skill) => (
                                <Badge key={skill} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {freelancer.skills.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{freelancer.skills.length - 5}
                                </Badge>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Joined {new Date(freelancer.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Star className="h-4 w-4" />
                          View Profile
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 text-destructive hover:text-destructive"
                          onClick={() => handleSuspendUser(freelancer.user_id)}
                          disabled={suspendUser.isPending}
                        >
                          <UserX className="h-4 w-4" />
                          Suspend
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            )}
          </>
        )}
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-4">
          {clientsError ? (
            <Card className="border-destructive">
              <CardContent className="pt-6 space-y-2">
                <p className="text-destructive font-semibold">Error loading clients</p>
                <p className="text-destructive text-sm">{getErrorMessage(clientsError)}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Total Clients: {clients?.length || 0}
                </p>
              </div>

              {clientsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="h-6 w-2/3 bg-muted animate-pulse rounded" />
                          <div className="h-4 w-full bg-muted animate-pulse rounded" />
                          <div className="flex gap-2">
                            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
                            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredClients.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No clients found</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredClients.map((client) => (
                    <Card key={client.user_id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-4 flex-1">
                            {client.avatar_url ? (
                              <img
                                src={client.avatar_url}
                                alt={client.full_name || "User"}
                                className="h-12 w-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                                {client.full_name?.[0] || "C"}
                              </div>
                            )}

                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{client.full_name || "Unknown"}</h3>
                                <Badge>Client</Badge>
                              </div>
                              {client.bio && (
                                <p className="text-sm text-muted-foreground">{client.bio}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                Joined {new Date(client.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="gap-2">
                              <Star className="h-4 w-4" />
                              View Profile
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2 text-destructive hover:text-destructive"
                              onClick={() => handleSuspendUser(client.user_id)}
                              disabled={suspendUser.isPending}
                            >
                              <UserX className="h-4 w-4" />
                              Suspend
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientFreelancerManagement;
