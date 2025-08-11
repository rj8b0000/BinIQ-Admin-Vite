import AdminLayout from "../components/AdminLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import DataTable, { Column } from "../components/ui/DataTable";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import {
  Store,
  Trash2,
  Check,
  X,
  MapPin,
  Clock,
  Phone,
  Mail,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  Eye,
  Edit3,
  Image,
  FileText,
  TrendingUp,
  RotateCcw,
  Heart,
  MessageSquare,
  MousePointer,
  Calendar,
} from "lucide-react";
import { useState, useEffect } from "react";
import { AuthService } from "../lib/auth";
import { API_CONFIG } from "../lib/api";
import { toast } from "../hooks/use-toast";

// Enhanced interfaces
interface StoreOwner {
  user: {
    _id: string;
    full_name: string;
    store_name: string;
    email: string;
    role: number;
    phone_number: string | null;
    address: string | null;
    profile_image: string | null;
    subscription: {
      type: string;
      start_date: string;
      end_date: string;
    };
    created_at: string;
    status: "pending" | "approved" | "rejected";
  };
}

interface StoreContent {
  _id: string;
  storeId: string;
  storeName: string;
  images: {
    url: string;
    description: string;
    uploadDate: string;
    status: "pending" | "approved" | "rejected";
    moderatorNotes?: string;
  }[];
  descriptions: {
    title: string;
    content: string;
    uploadDate: string;
    status: "pending" | "approved" | "rejected";
    moderatorNotes?: string;
  }[];
  pricing: {
    items: {
      name: string;
      price: number;
      currency: string;
      description: string;
    }[];
    lastUpdated: string;
    status: "pending" | "approved" | "rejected";
    moderatorNotes?: string;
  };
  engagement: {
    views: number;
    likes: number;
    clicks: number;
    lastMonth: {
      views: number;
      likes: number;
      clicks: number;
    };
  };
  versions: {
    id: string;
    timestamp: string;
    changes: string;
    moderator: string;
  }[];
}

interface StoreOwnersResponse {
  success: boolean;
  data: StoreOwner[];
}

export default function StoreOwnersEnhanced() {
  const [storeOwners, setStoreOwners] = useState<StoreOwner[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreOwner | null>(null);
  const [storeContent, setStoreContent] = useState<StoreContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [contentDialogOpen, setContentDialogOpen] = useState(false);
  const [moderatorNotes, setModeratorNotes] = useState("");

  const generateMockStoreOwners = (): StoreOwner[] => [
    {
      user: {
        _id: "1",
        full_name: "John Smith",
        store_name: "Smith's Electronics",
        email: "john@smithelectronics.com",
        role: 2,
        phone_number: "+1234567890",
        address: "123 Main St, New York, NY",
        profile_image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
        subscription: {
          type: "Premium",
          start_date: "2024-01-01",
          end_date: "2024-12-31",
        },
        created_at: "2024-01-15",
        status: "approved",
      },
    },
    {
      user: {
        _id: "2",
        full_name: "Sarah Johnson",
        store_name: "Green Valley Market",
        email: "sarah@greenvalley.com",
        role: 2,
        phone_number: "+1987654321",
        address: "456 Oak Ave, California, CA",
        profile_image: "https://images.unsplash.com/photo-1494790108755-2616b612e47c?w=150",
        subscription: {
          type: "Basic",
          start_date: "2024-02-01",
          end_date: "2024-08-01",
        },
        created_at: "2024-02-10",
        status: "pending",
      },
    },
  ];

  const generateMockStoreContent = (storeId: string): StoreContent => ({
    _id: storeId,
    storeId,
    storeName: "Smith's Electronics",
    images: [
      {
        url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400",
        description: "Store front view",
        uploadDate: "2024-01-20",
        status: "approved",
      },
      {
        url: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400",
        description: "Product showcase",
        uploadDate: "2024-01-22",
        status: "pending",
        moderatorNotes: "Please ensure product images meet quality standards",
      },
    ],
    descriptions: [
      {
        title: "Welcome to Smith's Electronics",
        content: "Your one-stop shop for all electronic needs. We offer quality products with excellent customer service.",
        uploadDate: "2024-01-20",
        status: "approved",
      },
      {
        title: "New Product Launch",
        content: "Exciting new gadgets now available! Visit our store for the latest technology.",
        uploadDate: "2024-01-25",
        status: "pending",
        moderatorNotes: "Content approved, needs minor formatting adjustments",
      },
    ],
    pricing: {
      items: [
        { name: "Smartphone", price: 599, currency: "USD", description: "Latest model smartphone" },
        { name: "Laptop", price: 999, currency: "USD", description: "High-performance laptop" },
        { name: "Headphones", price: 199, currency: "USD", description: "Noise-canceling headphones" },
      ],
      lastUpdated: "2024-01-20",
      status: "approved",
    },
    engagement: {
      views: 1250,
      likes: 89,
      clicks: 156,
      lastMonth: {
        views: 980,
        likes: 67,
        clicks: 123,
      },
    },
    versions: [
      {
        id: "v1",
        timestamp: "2024-01-20T10:00:00Z",
        changes: "Initial store setup and content approval",
        moderator: "Admin User",
      },
      {
        id: "v2",
        timestamp: "2024-01-25T14:30:00Z",
        changes: "Updated product descriptions and pricing",
        moderator: "Content Moderator",
      },
    ],
  });

  useEffect(() => {
    fetchStoreOwners();
  }, []);

  const fetchStoreOwners = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const baseUrl = API_CONFIG.BASE_URL;
      const response = await AuthService.makeAuthenticatedRequest(
        `${baseUrl}${API_CONFIG.ENDPOINTS.ALL_STORE_OWNERS}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: StoreOwnersResponse = await response.json();
      setStoreOwners(data.data || generateMockStoreOwners());
    } catch (err: any) {
      console.error("Error fetching store owners:", err);
      setError("Failed to load store owners. Using demo data.");
      setStoreOwners(generateMockStoreOwners());
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStoreContent = async (storeId: string) => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const response = await AuthService.makeAuthenticatedRequest(
        `${baseUrl}${API_CONFIG.ENDPOINTS.STORE_CONTENT.replace(":id", storeId)}`
      );

      if (response.ok) {
        const data = await response.json();
        setStoreContent(data.data || generateMockStoreContent(storeId));
      } else {
        setStoreContent(generateMockStoreContent(storeId));
      }
    } catch (err) {
      setStoreContent(generateMockStoreContent(storeId));
    }
  };

  const handleAction = async (action: "delete" | "approve" | "reject", userId: string) => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      let response;

      if (action === "delete") {
        response = await AuthService.makeAuthenticatedRequest(
          `${baseUrl}${API_CONFIG.ENDPOINTS.DELETE_ACCOUNT}?user_id=${userId}`,
          { method: "DELETE" }
        );
      } else {
        const endpoint = action === "approve" 
          ? API_CONFIG.ENDPOINTS.APPROVE_STORE_OWNER 
          : API_CONFIG.ENDPOINTS.REJECT_STORE_OWNER;
        
        response = await AuthService.makeAuthenticatedRequest(
          `${baseUrl}${endpoint}`,
          {
            method: "POST",
            body: JSON.stringify({ user_id: userId }),
          }
        );
      }

      if (response.ok) {
        toast({
          title: "Success",
          description: `Store owner ${action}d successfully.`,
        });
        fetchStoreOwners(); // Refresh the list
      } else {
        throw new Error(`Failed to ${action} store owner`);
      }
    } catch (err: any) {
      console.error(`Error ${action}ing store owner:`, err);
      toast({
        title: "Error",
        description: `Failed to ${action} store owner.`,
        variant: "destructive",
      });
    }
  };

  const handleContentAction = async (contentType: string, action: "approve" | "reject") => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const response = await AuthService.makeAuthenticatedRequest(
        `${baseUrl}${API_CONFIG.ENDPOINTS.STORE_CONTENT_APPROVE.replace(":id", selectedStore?.user._id || "")}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            contentType,
            action,
            notes: moderatorNotes,
          }),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: `Content ${action}d successfully.`,
        });
        if (selectedStore) {
          fetchStoreContent(selectedStore.user._id);
        }
      } else {
        throw new Error(`Failed to ${action} content`);
      }
    } catch (err: any) {
      console.error(`Error ${action}ing content:`, err);
      toast({
        title: "Error",
        description: `Failed to ${action} content.`,
        variant: "destructive",
      });
    }
  };

  const handleRollback = async (versionId: string) => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const response = await AuthService.makeAuthenticatedRequest(
        `${baseUrl}${API_CONFIG.ENDPOINTS.STORE_CONTENT_ROLLBACK.replace(":id", selectedStore?.user._id || "")}`,
        {
          method: "POST",
          body: JSON.stringify({ versionId }),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Content rolled back successfully.",
        });
        if (selectedStore) {
          fetchStoreContent(selectedStore.user._id);
        }
      } else {
        throw new Error("Failed to rollback content");
      }
    } catch (err: any) {
      console.error("Error rolling back content:", err);
      toast({
        title: "Error",
        description: "Failed to rollback content.",
        variant: "destructive",
      });
    }
  };

  const storeOwnersColumns: Column<StoreOwner>[] = [
    {
      key: "store_name",
      header: "Store Name",
      sortable: true,
      searchable: true,
      render: (_, storeOwner) => (
        <div className="flex items-center gap-3">
          <img
            src={storeOwner.user.profile_image || "/placeholder-store.png"}
            alt={storeOwner.user.store_name}
            className="w-10 h-10 rounded-lg object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder-store.png";
            }}
          />
          <div>
            <p className="font-medium">{storeOwner.user.store_name}</p>
            <p className="text-sm text-muted-foreground">{storeOwner.user.full_name}</p>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Contact",
      searchable: true,
      render: (_, storeOwner) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{storeOwner.user.email}</span>
          </div>
          {storeOwner.user.phone_number && (
            <div className="flex items-center gap-1">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{storeOwner.user.phone_number}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "subscription",
      header: "Subscription",
      render: (_, storeOwner) => (
        <Badge variant={storeOwner.user.subscription.type === "Premium" ? "default" : "secondary"}>
          {storeOwner.user.subscription.type}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (_, storeOwner) => (
        <Badge
          variant={
            storeOwner.user.status === "approved"
              ? "default"
              : storeOwner.user.status === "rejected"
              ? "destructive"
              : "secondary"
          }
        >
          {storeOwner.user.status.charAt(0).toUpperCase() + storeOwner.user.status.slice(1)}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "Joined",
      sortable: true,
      render: (_, storeOwner) => new Date(storeOwner.user.created_at).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, storeOwner) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedStore(storeOwner);
              setDetailsDialogOpen(true);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedStore(storeOwner);
              fetchStoreContent(storeOwner.user._id);
              setContentDialogOpen(true);
            }}
          >
            <FileText className="w-4 h-4" />
          </Button>

          {storeOwner.user.status === "pending" && (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-green-600">
                    <Check className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Approve Store Owner</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to approve {storeOwner.user.store_name}?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleAction("approve", storeOwner.user._id)}
                    >
                      Approve
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-600">
                    <X className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reject Store Owner</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to reject {storeOwner.user.store_name}?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleAction("reject", storeOwner.user._id)}
                    >
                      Reject
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-600">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Store Owner</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {storeOwner.user.store_name}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleAction("delete", storeOwner.user._id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  const stats = {
    total: storeOwners.length,
    approved: storeOwners.filter(so => so.user.status === "approved").length,
    pending: storeOwners.filter(so => so.user.status === "pending").length,
    rejected: storeOwners.filter(so => so.user.status === "rejected").length,
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Loading store owners...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Store Owners Management</h1>
          <p className="text-muted-foreground">
            Manage store owners, approve applications, and moderate content
          </p>
        </div>

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
                <Store className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Stores</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <X className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Store Owners Table */}
        <Card>
          <CardHeader>
            <CardTitle>Store Owners ({storeOwners.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={storeOwners}
              columns={storeOwnersColumns}
              searchable={true}
              sortable={true}
            />
          </CardContent>
        </Card>

        {/* Store Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Store Owner Details</DialogTitle>
            </DialogHeader>
            {selectedStore && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedStore.user.profile_image || "/placeholder-store.png"}
                    alt={selectedStore.user.store_name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-semibold">{selectedStore.user.store_name}</h3>
                    <p className="text-muted-foreground">{selectedStore.user.full_name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Email:</span> {selectedStore.user.email}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {selectedStore.user.phone_number || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Address:</span> {selectedStore.user.address || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Joined:</span> {new Date(selectedStore.user.created_at).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>{" "}
                    <Badge variant={selectedStore.user.status === "approved" ? "default" : "secondary"}>
                      {selectedStore.user.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Subscription:</span>{" "}
                    <Badge variant="outline">{selectedStore.user.subscription.type}</Badge>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Content Moderation Dialog */}
        <Dialog open={contentDialogOpen} onOpenChange={setContentDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Content Moderation - {selectedStore?.user.store_name}</DialogTitle>
            </DialogHeader>
            
            {storeContent && (
              <Tabs defaultValue="images" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="images">Images</TabsTrigger>
                  <TabsTrigger value="descriptions">Descriptions</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="images" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {storeContent.images.map((image, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <img
                            src={image.url}
                            alt={image.description}
                            className="w-full h-48 object-cover rounded-lg mb-3"
                          />
                          <div className="space-y-2">
                            <p className="font-medium">{image.description}</p>
                            <p className="text-sm text-muted-foreground">
                              Uploaded: {new Date(image.uploadDate).toLocaleDateString()}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge variant={
                                image.status === "approved" ? "default" :
                                image.status === "rejected" ? "destructive" : "secondary"
                              }>
                                {image.status}
                              </Badge>
                              {image.status === "pending" && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleContentAction("image", "approve")}
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleContentAction("image", "reject")}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                            {image.moderatorNotes && (
                              <p className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                                Note: {image.moderatorNotes}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="descriptions" className="space-y-4">
                  {storeContent.descriptions.map((desc, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium">{desc.title}</h4>
                            <Badge variant={
                              desc.status === "approved" ? "default" :
                              desc.status === "rejected" ? "destructive" : "secondary"
                            }>
                              {desc.status}
                            </Badge>
                          </div>
                          <p className="text-sm">{desc.content}</p>
                          <p className="text-xs text-muted-foreground">
                            Updated: {new Date(desc.uploadDate).toLocaleDateString()}
                          </p>
                          {desc.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleContentAction("description", "approve")}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleContentAction("description", "reject")}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                          {desc.moderatorNotes && (
                            <p className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                              Note: {desc.moderatorNotes}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="pricing" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Pricing Information</CardTitle>
                        <Badge variant={
                          storeContent.pricing.status === "approved" ? "default" :
                          storeContent.pricing.status === "rejected" ? "destructive" : "secondary"
                        }>
                          {storeContent.pricing.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {storeContent.pricing.items.map((item, index) => (
                            <div key={index} className="border rounded-lg p-3">
                              <h5 className="font-medium">{item.name}</h5>
                              <p className="text-lg font-bold text-green-600">
                                ${item.price} {item.currency}
                              </p>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                          ))}
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          Last updated: {new Date(storeContent.pricing.lastUpdated).toLocaleDateString()}
                        </p>

                        {storeContent.pricing.status === "pending" && (
                          <div className="flex gap-2">
                            <Button onClick={() => handleContentAction("pricing", "approve")}>
                              <Check className="w-4 h-4 mr-1" />
                              Approve Pricing
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleContentAction("pricing", "reject")}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Reject Pricing
                            </Button>
                          </div>
                        )}

                        {storeContent.pricing.moderatorNotes && (
                          <p className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                            Note: {storeContent.pricing.moderatorNotes}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2">
                          <Eye className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">Views</p>
                            <p className="text-2xl font-bold">{storeContent.engagement.views}</p>
                            <p className="text-xs text-green-600">
                              +{storeContent.engagement.views - storeContent.engagement.lastMonth.views} from last month
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2">
                          <Heart className="w-5 h-5 text-red-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">Likes</p>
                            <p className="text-2xl font-bold">{storeContent.engagement.likes}</p>
                            <p className="text-xs text-green-600">
                              +{storeContent.engagement.likes - storeContent.engagement.lastMonth.likes} from last month
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2">
                          <MousePointer className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">Clicks</p>
                            <p className="text-2xl font-bold">{storeContent.engagement.clicks}</p>
                            <p className="text-xs text-green-600">
                              +{storeContent.engagement.clicks - storeContent.engagement.lastMonth.clicks} from last month
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Version History */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Version History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {storeContent.versions.map((version) => (
                          <div key={version.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">Version {version.id}</p>
                              <p className="text-sm text-muted-foreground">{version.changes}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(version.timestamp).toLocaleString()} by {version.moderator}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRollback(version.id)}
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Rollback
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}

            <div className="space-y-3">
              <label className="text-sm font-medium">Moderator Notes</label>
              <Textarea
                placeholder="Add notes for this moderation action..."
                value={moderatorNotes}
                onChange={(e) => setModeratorNotes(e.target.value)}
                rows={3}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
