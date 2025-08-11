import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import DataTable from "../components/ui/DataTable";
import { toast } from "../hooks/use-toast";
import { AuthService } from "../lib/auth";
import { API_CONFIG } from "../lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Gift,
  Calendar,
  User,
  Crown,
  Plus,
  Search,
  Filter,
  Download,
  Edit3,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface PartnershipSubscription {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: "store-owner" | "reseller";
  planType: "premium" | "enterprise" | "custom";
  assignedBy: string;
  assignedDate: string;
  expiryDate: string;
  status: "active" | "expired" | "pending";
  notes?: string;
  autoRenew: boolean;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: "store-owner" | "reseller";
  currentPlan: string;
}

export default function Marketing() {
  const [subscriptions, setSubscriptions] = useState<PartnershipSubscription[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<PartnershipSubscription | null>(null);

  // Form states
  const [assignForm, setAssignForm] = useState({
    userId: "",
    planType: "",
    duration: "30", // days
    notes: "",
    autoRenew: false,
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");

  // Table columns for partnership subscriptions
  const columns = [
    {
      key: "userName",
      header: "User",
      searchable: true,
      render: (value: string, subscription: PartnershipSubscription) => (
        <div className="space-y-1">
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground">{subscription.userEmail}</div>
          <Badge variant={subscription.userRole === "store-owner" ? "default" : "secondary"}>
            {subscription.userRole?.replace("-", " ") || "Unknown"}
          </Badge>
        </div>
      ),
    },
    {
      key: "planType",
      header: "Plan",
      render: (value: string) => (
        <Badge variant={
          value === "enterprise" ? "default" :
          value === "premium" ? "secondary" :
          "outline"
        }>
          <Crown className="w-3 h-3 mr-1" />
          {value ? value.charAt(0).toUpperCase() + value.slice(1) : "Unknown"}
        </Badge>
      ),
    },
    {
      key: "assignedDate",
      header: "Assigned Date",
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          {value ? new Date(value).toLocaleDateString() : "N/A"}
        </div>
      ),
    },
    {
      key: "expiryDate",
      header: "Expiry Date",
      sortable: true,
      render: (value: string) => {
        const isExpired = new Date(value) < new Date();
        const isExpiringSoon = new Date(value) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        
        return (
          <div className={`flex items-center gap-1 ${
            isExpired ? 'text-red-600' : 
            isExpiringSoon ? 'text-yellow-600' : 
            'text-muted-foreground'
          }`}>
            <Calendar className="w-4 h-4" />
            {value ? new Date(value).toLocaleDateString() : "N/A"}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (value: string) => (
        <Badge variant={
          value === "active" ? "default" :
          value === "expired" ? "destructive" :
          "secondary"
        }>
          {value === "active" ? <CheckCircle className="w-3 h-3 mr-1" /> :
           value === "expired" ? <XCircle className="w-3 h-3 mr-1" /> :
           <Clock className="w-3 h-3 mr-1" />}
          {value ? value.charAt(0).toUpperCase() + value.slice(1) : "Unknown"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_: any, subscription: PartnershipSubscription) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditSubscription(subscription)}
          >
            <Edit3 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600"
            onClick={() => handleRevokeSubscription(subscription._id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const baseUrl = API_CONFIG.BASE_URL;

      // Fetch partnership subscriptions and users
      const [subscriptionsRes, usersRes] = await Promise.all([
        AuthService.makeAuthenticatedRequest(`${baseUrl}${API_CONFIG.ENDPOINTS.PARTNERSHIP_SUBSCRIPTIONS}`),
        AuthService.makeAuthenticatedRequest(`${baseUrl}/api/users/all`),
      ]);

      if (!subscriptionsRes.ok || !usersRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const subscriptionsData = await subscriptionsRes.json();
      const usersData = await usersRes.json();

      setSubscriptions(subscriptionsData.data || generateMockSubscriptions());
      setUsers(usersData.data || generateMockUsers());

    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Using demo data.");
      
      // Load mock data for demo
      setSubscriptions(generateMockSubscriptions());
      setUsers(generateMockUsers());
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data generators
  const generateMockSubscriptions = (): PartnershipSubscription[] => [
    {
      _id: "1",
      userId: "user1",
      userName: "John Smith",
      userEmail: "john@example.com",
      userRole: "store-owner",
      planType: "premium",
      assignedBy: "admin",
      assignedDate: "2024-01-15",
      expiryDate: "2024-02-15",
      status: "active",
      notes: "Special partnership deal",
      autoRenew: false,
    },
    {
      _id: "2",
      userId: "user2",
      userName: "Sarah Johnson",
      userEmail: "sarah@example.com",
      userRole: "reseller",
      planType: "enterprise",
      assignedBy: "admin",
      assignedDate: "2024-01-10",
      expiryDate: "2024-03-10",
      status: "active",
      notes: "Strategic partner",
      autoRenew: true,
    },
  ];

  const generateMockUsers = (): User[] => [
    { _id: "user1", name: "John Smith", email: "john@example.com", role: "store-owner", currentPlan: "free" },
    { _id: "user2", name: "Sarah Johnson", email: "sarah@example.com", role: "reseller", currentPlan: "basic" },
    { _id: "user3", name: "Mike Chen", email: "mike@example.com", role: "store-owner", currentPlan: "free" },
  ];

  const handleAssignSubscription = async () => {
    try {
      const selectedUser = users.find(u => u._id === assignForm.userId);
      if (!selectedUser) {
        toast({
          title: "Error",
          description: "Please select a user.",
          variant: "destructive",
        });
        return;
      }

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(assignForm.duration));

      const response = await AuthService.makeAuthenticatedRequest(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ASSIGN_PARTNERSHIP_PLAN}`,
        {
          method: "POST",
          body: JSON.stringify({
            userId: assignForm.userId,
            planType: assignForm.planType,
            expiryDate: expiryDate.toISOString(),
            notes: assignForm.notes,
            autoRenew: assignForm.autoRenew,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: "Success",
        description: "Partnership subscription assigned successfully.",
      });

      setAssignDialogOpen(false);
      setAssignForm({
        userId: "",
        planType: "",
        duration: "30",
        notes: "",
        autoRenew: false,
      });
      
      fetchData(); // Refresh the list
    } catch (err: any) {
      console.error("Error assigning subscription:", err);
      toast({
        title: "Error",
        description: "Failed to assign subscription.",
        variant: "destructive",
      });
    }
  };

  const handleEditSubscription = (subscription: PartnershipSubscription) => {
    setSelectedSubscription(subscription);
    setEditDialogOpen(true);
  };

  const handleRevokeSubscription = async (subscriptionId: string) => {
    try {
      const response = await AuthService.makeAuthenticatedRequest(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PARTNERSHIP_SUBSCRIPTIONS}/${subscriptionId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: "Success",
        description: "Partnership subscription revoked successfully.",
      });

      fetchData(); // Refresh the list
    } catch (err: any) {
      console.error("Error revoking subscription:", err);
      toast({
        title: "Error",
        description: "Failed to revoke subscription.",
        variant: "destructive",
      });
    }
  };

  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesSearch = 
      subscription.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subscription.userEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || subscription.status === statusFilter;
    const matchesPlan = planFilter === "all" || subscription.planType === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === "active").length,
    expired: subscriptions.filter(s => s.status === "expired").length,
    expiringSoon: subscriptions.filter(s => {
      const expiry = new Date(s.expiryDate);
      const soon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      return expiry < soon && s.status === "active";
    }).length,
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Loading marketing data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Marketing & Partnerships</h1>
            <p className="text-muted-foreground">
              Manage partnership subscriptions and promotional campaigns
            </p>
          </div>
          
          <Button onClick={() => setAssignDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Assign Partnership Plan
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <p className="text-orange-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Plans</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Expiring Soon</p>
                  <p className="text-2xl font-bold">{stats.expiringSoon}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Expired</p>
                  <p className="text-2xl font-bold">{stats.expired}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="subscriptions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="subscriptions">Partnership Subscriptions</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="analytics">Marketing Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="subscriptions" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={planFilter} onValueChange={setPlanFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Plan Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Plans</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Subscriptions Table */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Partnership Subscriptions ({filteredSubscriptions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={filteredSubscriptions}
                  columns={columns}
                  searchable={true}
                  sortable={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns">
            <Card>
              <CardHeader>
                <CardTitle>Marketing Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Campaign management features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Marketing Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Marketing analytics coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Assign Partnership Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Partnership Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="user">Select User</Label>
                <Select value={assignForm.userId} onValueChange={(value) => setAssignForm(prev => ({ ...prev, userId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name} ({user.email}) - {user.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="planType">Plan Type</Label>
                <Select value={assignForm.planType} onValueChange={(value) => setAssignForm(prev => ({ ...prev, planType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose plan type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="duration">Duration (Days)</Label>
                <Input
                  type="number"
                  value={assignForm.duration}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="30"
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  value={assignForm.notes}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Partnership details..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignSubscription}>
                Assign Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
