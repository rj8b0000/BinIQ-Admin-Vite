import AdminLayout from "../components/AdminLayout";
import StatsCard from "../components/ui/StatsCard";
import DataTable, { Column } from "../components/ui/DataTable";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Users, Store, CreditCard, Star, MessageSquare, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthService } from "../lib/auth";

// Define interfaces for API responses
interface PaidUsersResponse {
  success: boolean;
  data: {
    totalPaidUsers: number;
    monthlyIncreasePercentage: number;
  };
}

interface StoreOwnersResponse {
  success: boolean;
  data: {
    totalStoreOwners: number;
    monthlyIncreasePercentage: number;
  };
}

interface ResellersResponse {
  success: boolean;
  data: {
    totalResellers: number;
    monthlyIncreasePercentage: number;
  };
}

interface RevenueResponse {
  success: boolean;
  data: {
    totalRevenue: number;
    monthlyIncreasePercentage: number;
  };
}

interface RecentActivity {
  name: string;
  type: "reseller" | "store-owner";
  timeInHours: number;
}

interface RecentActivityResponse {
  success: boolean;
  data: RecentActivity[];
}

interface QuickStatsResponse {
  success: boolean;
  data: {
    premiumUsers: {
      count: number;
      percentage: number;
    };
    averageRating: number;
    pendingReplies: number;
    activeSubscriptions: number;
    newUsersToday: number;
  };
}

interface Feedback {
  _id: string;
  rating: number;
  user_name: string;
  user_email: string;
  suggestion: string;
  user_id: string;
  type: "reseller" | "store-owner";
  status: "replied" | "pending";
  reply: string | null;
  created_at: string;
  __v: number;
}

interface ReplyResponse {
  message: string;
  feedback: Feedback;
}

// Reply Modal Component
interface ReplyModalProps {
  feedback: Feedback;
  onClose: () => void;
  onSubmit: (feedbackId: string, reply: string) => Promise<void>;
}

function ReplyModal({ feedback, onClose, onSubmit }: ReplyModalProps) {
  const [reply, setReply] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) {
      setError("Reply cannot be empty");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(feedback._id, reply);
      setReply("");
      onClose();
    } catch (err) {
      setError("Failed to send reply. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Reply to Feedback</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          Feedback from {feedback.user_name} ({feedback.user_email})
        </p>
        <p className="text-sm mb-4">{feedback.suggestion}</p>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <textarea
            className="w-full p-2 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write your reply..."
            disabled={isSubmitting}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

const feedbackColumns: Column<Feedback>[] = [
  {
    key: "user_name",
    header: "Username",
    sortable: true,
    searchable: true,
  },
  {
    key: "type",
    header: "Type",
    sortable: true,
    render: (value) => (
      <Badge variant={value === "store-owner" ? "default" : "secondary"}>
        {value ? value.replace("-", " ") : "Unknown"}
      </Badge>
    ),
  },
  {
    key: "rating",
    header: "Rating",
    sortable: true,
    render: (value) => (
      <div className="flex items-center gap-1">
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        <span>{value || "N/A"}</span>
      </div>
    ),
  },
  {
    key: "suggestion",
    header: "Message",
    searchable: true,
    render: (value) => (
      <div className="max-w-xs truncate" title={value || ""}>
        {value || "No message"}
      </div>
    ),
  },
  {
    key: "created_at",
    header: "Date",
    sortable: true,
    render: (value) => new Date(value).toLocaleDateString(),
  },
  {
    key: "status",
    header: "Status",
    render: (value) => (
      <Badge variant={value === "replied" ? "default" : "destructive"}>
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </Badge>
    ),
  },
  {
    key: "_id",
    header: "Action",
    render: (_, row, setSelectedFeedback) => (
      <Button
        size="sm"
        variant="outline"
        disabled={row.status === "replied"}
        onClick={() => setSelectedFeedback(row)}
      >
        {row.status === "replied" ? "Replied" : "Reply"}
      </Button>
    ),
  },
];

export default function Dashboard() {
  // State for API data
  const [paidUsers, setPaidUsers] = useState<PaidUsersResponse["data"] | null>(
    null
  );
  const [storeOwners, setStoreOwners] = useState<
    StoreOwnersResponse["data"] | null
  >(null);
  const [resellers, setResellers] = useState<ResellersResponse["data"] | null>(
    null
  );
  const [revenue, setRevenue] = useState<RevenueResponse["data"] | null>(null);
  const [quickStats, setQuickStats] = useState<
    QuickStatsResponse["data"] | null
  >(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null
  );

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const baseUrl =
          import.meta.env.VITE_API_URL ||
          "https://bin-iq-backend.vercel.app/api";

        // Fetch all stats concurrently
        const [
          paidUsersRes,
          storeOwnersRes,
          resellersRes,
          revenueRes,
          quickStatsRes,
          recentActivityRes,
          feedbackRes,
        ] = await Promise.all([
          AuthService.makeAuthenticatedRequest(`${baseUrl}/stats/paid-users`),
          AuthService.makeAuthenticatedRequest(`${baseUrl}/stats/store-owners`),
          AuthService.makeAuthenticatedRequest(`${baseUrl}/stats/resellers`),
          AuthService.makeAuthenticatedRequest(`${baseUrl}/stats/revenue`),
          AuthService.makeAuthenticatedRequest(`${baseUrl}/stats/quick-stats`),
          AuthService.makeAuthenticatedRequest(
            `${baseUrl}/stats/recent-activity`
          ),
          AuthService.makeAuthenticatedRequest(`${baseUrl}/users/feedback`),
        ]);

        // Parse responses
        const paidUsersData: PaidUsersResponse = await paidUsersRes.json();
        const storeOwnersData: StoreOwnersResponse =
          await storeOwnersRes.json();
        const resellersData: ResellersResponse = await resellersRes.json();
        const revenueData: RevenueResponse = await revenueRes.json();
        const quickStatsData: QuickStatsResponse = await quickStatsRes.json();
        const recentActivityData: RecentActivityResponse =
          await recentActivityRes.json();
        const feedbackData: Feedback[] = await feedbackRes.json();

        setPaidUsers(paidUsersData.data);
        setStoreOwners(storeOwnersData.data);
        setResellers(resellersData.data);
        setRevenue(revenueData.data);
        setQuickStats(quickStatsData.data);
        setRecentActivity(recentActivityData.data);
        setFeedbacks(feedbackData);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle reply submission
  const handleReplySubmit = async (feedbackId: string, reply: string) => {
    const baseUrl =
      import.meta.env.VITE_API_URL || "https://bin-iq-backend.vercel.app/api";
    try {
      const response = await AuthService.makeAuthenticatedRequest(
        `${baseUrl}/users/feedback/reply`,
        {
          method: "POST",
          body: JSON.stringify({ feedback_id: feedbackId, reply }),
        }
      );
      const data: ReplyResponse = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to send reply");
      }
      // Optimistically update feedback status
      setFeedbacks((prev) =>
        prev.map((fb) =>
          fb._id === feedbackId ? { ...fb, status: "replied", reply } : fb
        )
      );
    } catch (err) {
      throw err;
    }
  };

  // Format time for recent activity
  const formatTime = (hours: number) => {
    if (hours === 0) return "Just now";
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your binIQ admin dashboard
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Stats Cards */}
        {isLoading ? (
          <div>Loading stats...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Paid Users"
              value={paidUsers?.totalPaidUsers.toString() ?? "0"}
              description="Active subscribers"
              icon={<Users className="h-4 w-4" />}
              trend={{
                value: paidUsers?.monthlyIncreasePercentage ?? 0,
                label: "from last month",
                positive: (paidUsers?.monthlyIncreasePercentage ?? 0) > 0,
              }}
            />
            <StatsCard
              title="Store Owners"
              value={storeOwners?.totalStoreOwners.toString() ?? "0"}
              description="Registered stores"
              icon={<Store className="h-4 w-4" />}
              trend={{
                value: storeOwners?.monthlyIncreasePercentage ?? 0,
                label: "from last month",
                positive: (storeOwners?.monthlyIncreasePercentage ?? 0) > 0,
              }}
            />
            <StatsCard
              title="Resellers"
              value={resellers?.totalResellers.toString() ?? "0"}
              description="Active resellers"
              icon={<CreditCard className="h-4 w-4" />}
              trend={{
                value: resellers?.monthlyIncreasePercentage ?? 0,
                label: "from last month",
                positive: (resellers?.monthlyIncreasePercentage ?? 0) > 0,
              }}
            />
            <StatsCard
              title="Revenue"
              value={`₹${revenue?.totalRevenue.toLocaleString("en-IN") ?? "0"}`}
              description="This month"
              icon={<CreditCard className="h-4 w-4" />}
              trend={{
                value: revenue?.monthlyIncreasePercentage ?? 0,
                label: "from last month",
                positive: (revenue?.monthlyIncreasePercentage ?? 0) > 0,
              }}
            />
          </div>
        )}

        {/* Recent Activity and Quick Stats */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Feedbacks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recent Feedbacks
              </CardTitle>
              <CardDescription>
                Latest customer feedback and reviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div>Loading feedbacks...</div>
              ) : (
                <DataTable
                  data={feedbacks}
                  columns={feedbackColumns.map(
                    (col): Column<Feedback> =>
                      col.key === "_id"
                        ? {
                            ...col,
                            render: (value: any, row: Feedback) =>
                              col.render(value, row, setSelectedFeedback),
                          }
                        : col
                  )}
                  searchPlaceholder="Search feedbacks..."
                  pageSize={5}
                />
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Statistics</CardTitle>
              <CardDescription>Key metrics at a glance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div>Loading stats...</div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Premium Users
                    </span>
                    <span className="font-medium">
                      {quickStats?.premiumUsers.count ?? 0} (
                      {quickStats?.premiumUsers.percentage ?? 0}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Average Rating
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">
                        {quickStats?.averageRating ?? 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Pending Replies
                    </span>
                    <Badge variant="destructive">
                      {quickStats?.pendingReplies ?? 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Active Subscriptions
                    </span>
                    <span className="font-medium">
                      {quickStats?.activeSubscriptions ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      New Users Today
                    </span>
                    <span className="font-medium text-green-600">
                      {quickStats?.newUsersToday ?? 0}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Registrations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest user registrations and activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Loading activities...</div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b pb-3 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-biniq-teal/10 flex items-center justify-center">
                        {activity.type === "store-owner" ? (
                          <Store className="w-4 h-4 text-biniq-teal" />
                        ) : (
                          <Users className="w-4 h-4 text-biniq-blue" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {activity.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          registered as {activity.type ? activity.type.replace("-", " ") : "Unknown"}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatTime(activity.timeInHours)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reply Modal */}
        {selectedFeedback && (
          <ReplyModal
            feedback={selectedFeedback}
            onClose={() => setSelectedFeedback(null)}
            onSubmit={handleReplySubmit}
          />
        )}
      </div>
    </AdminLayout>
  );
}
