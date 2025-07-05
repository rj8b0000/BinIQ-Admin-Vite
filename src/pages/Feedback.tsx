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
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { MessageSquare, Star, Reply, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { AuthService } from "../lib/auth";

interface FeedbackItem {
  _id: string;
  rating: number;
  username: string; // Maps to user_name
  userType: "Store Owner" | "Reseller"; // Maps to type
  message: string; // Maps to suggestion
  email: string; // Maps to user_email
  date: string; // Maps to created_at
  replied: boolean; // Maps to status ("replied" | "pending")
  reply: string | null; // Maps to reply
  user_id: string | null;
}

interface FeedbackResponse {
  _id: string;
  rating: number;
  user_name: string;
  user_email: string;
  suggestion: string;
  user_id: string | null;
  type: "reseller" | "store_owner";
  status: "replied" | "pending";
  reply: string | null;
  created_at: string;
  __v: number;
}

interface FeedbackStats {
  totalFeedback: number;
  averageRating: number;
  pendingReplies: number;
  repliedCount: number;
}

export default function Feedback() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(
    null
  );
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<FeedbackStats>({
    totalFeedback: 0,
    averageRating: 0,
    pendingReplies: 0,
    repliedCount: 0,
  });

  // Fetch feedback data
  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const baseUrl =
          import.meta.env.VITE_API_URL ||
          "https://bin-iq-backend.vercel.app/api";
        const response = await AuthService.makeAuthenticatedRequest(
          `${baseUrl}/users/feedback`
        );
        const data: FeedbackResponse[] = await response.json();

        console.log("Fetched feedbacks:", data); // Debug log

        // Map API data to FeedbackItem
        const mappedFeedbacks: FeedbackItem[] = data.map((fb, index) => ({
          _id: fb._id,
          rating: fb.rating,
          username: fb.user_name,
          userType: fb.type === "store_owner" ? "Store Owner" : "Reseller",
          message: fb.suggestion,
          email: fb.user_email,
          date: new Date(fb.created_at).toLocaleDateString(),
          replied: fb.status === "replied",
          reply: fb.reply,
          user_id: fb.user_id,
        }));

        // Calculate stats
        const totalFeedback = mappedFeedbacks.length;
        const averageRating =
          totalFeedback > 0
            ? Number(
                (
                  mappedFeedbacks.reduce((sum, f) => sum + f.rating, 0) /
                  totalFeedback
                ).toFixed(1)
              )
            : 0;
        const pendingReplies = mappedFeedbacks.filter((f) => !f.replied).length;
        const repliedCount = mappedFeedbacks.filter((f) => f.replied).length;

        console.log("Computed stats:", {
          totalFeedback,
          averageRating,
          pendingReplies,
          repliedCount,
        }); // Debug log

        setFeedbacks(mappedFeedbacks);
        setStats({
          totalFeedback,
          averageRating,
          pendingReplies,
          repliedCount,
        });
      } catch (err: any) {
        console.error("Error fetching feedbacks:", err);
        setError("Failed to load feedbacks. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  const handleReply = (feedback: FeedbackItem) => {
    console.log("Opening reply dialog for:", feedback.username); // Debug log
    setSelectedFeedback(feedback);
    setReplyDialogOpen(true);
  };

  const handleViewDetails = (feedback: FeedbackItem) => {
    console.log("Opening details for feedback:", feedback.username); // Debug log
    setSelectedFeedback(feedback);
    setDetailsDialogOpen(true);
  };

  const handleSendReply = async () => {
    if (!selectedFeedback || !replyMessage.trim()) return;

    try {
      const baseUrl =
        import.meta.env.VITE_API_URL || "https://bin-iq-backend.vercel.app/api";
      const response = await AuthService.makeAuthenticatedRequest(
        `${baseUrl}/users/feedback/reply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            feedback_id: selectedFeedback._id,
            reply: replyMessage,
          }),
        }
      );
      const result = await response.json();

      console.log("Reply response:", result); // Debug log

      if (result.message === "Feedback replied successfully") {
        // Update feedback state
        setFeedbacks((prev) =>
          prev.map((fb) =>
            fb._id === selectedFeedback._id
              ? { ...fb, replied: true, reply: replyMessage }
              : fb
          )
        );
        // Update stats
        setStats((prev) => ({
          ...prev,
          pendingReplies: prev.pendingReplies - 1,
          repliedCount: prev.repliedCount + 1,
        }));
      }
    } catch (err: any) {
      console.error("Error sending reply:", err);
      setError("Failed to send reply. Please try again.");
    }

    setReplyDialogOpen(false);
    setReplyMessage("");
    setSelectedFeedback(null);
  };

  const feedbackColumns: Column<FeedbackItem>[] = [
    {
      key: "srNo",
      header: "Sr No.",
      sortable: true,
      render: (_, row, index, feedbacks) => {
        const rowIndex = feedbacks.findIndex((fb) => fb._id === row._id) + 1;
        return rowIndex;
      },
    },
    {
      key: "username",
      header: "Username",
      sortable: true,
      searchable: true,
      render: (_, row) => row.username || "N/A",
    },
    {
      key: "userType",
      header: "Type",
      sortable: true,
      render: (_, row) => (
        <Badge
          variant={row.userType === "Store Owner" ? "default" : "secondary"}
        >
          {row.userType}
        </Badge>
      ),
    },
    {
      key: "rating",
      header: "Rating",
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="font-medium">{row.rating}/5</span>
        </div>
      ),
    },
    {
      key: "message",
      header: "Message",
      searchable: true,
      render: (_, row) => (
        <div className="max-w-xs truncate" title={row.message}>
          {row.message || "N/A"}
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      searchable: true,
      render: (_, row) => row.email || "N/A",
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      render: (_, row) => row.date,
    },
    {
      key: "replied",
      header: "Status",
      render: (_, row) => (
        <Badge variant={row.replied ? "default" : "destructive"}>
          {row.replied ? "Replied" : "Pending"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, row, _index, _feedbacks, handleViewDetails) => {
        console.log("Rendering Actions column for:", row.username); // Debug log
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleViewDetails(row)}
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={row.replied}
              onClick={() => handleReply(row)}
              title="Reply"
            >
              <Reply className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  // Pass handleViewDetails to Actions column
  const columnsWithSetters = feedbackColumns.map((col) => ({
    ...col,
    render: (value: any, row: FeedbackItem, index?: number) => {
      console.log("Rendering column:", col.key, "for user:", row.username); // Debug log
      if (col.key === "actions") {
        return col.render(value, row, index, feedbacks, handleViewDetails);
      }
      return col.render ? col.render(value, row, index, feedbacks) : value;
    },
  }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Feedback</h1>
          <p className="text-muted-foreground">
            Manage customer feedback and replies
          </p>
        </div>

        {/* Feedback Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Feedback
                  </p>
                  <p className="text-2xl font-bold text-biniq-navy">
                    {isLoading ? "Loading..." : stats.totalFeedback}
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-biniq-teal" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Average Rating
                  </p>
                  <div className="flex items-center gap-1">
                    <p className="text-2xl font-bold text-biniq-navy">
                      {isLoading ? "Loading..." : stats.averageRating}
                    </p>
                    {!isLoading && (
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Pending Replies
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {isLoading ? "Loading..." : stats.pendingReplies}
                  </p>
                </div>
                <Badge variant="destructive">Pending</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Replied</p>
                  <p className="text-2xl font-bold text-green-600">
                    {isLoading ? "Loading..." : stats.repliedCount}
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-800">Replied</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Customer Feedback ({feedbacks.length} total)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Loading feedbacks...</div>
            ) : error ? (
              <div className="text-red-600">{error}</div>
            ) : feedbacks.length === 0 ? (
              <div>No feedbacks found.</div>
            ) : (
              <DataTable
                data={feedbacks}
                columns={columnsWithSetters}
                searchPlaceholder="Search feedback..."
                pageSize={10}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Reply to Feedback</DialogTitle>
            <DialogDescription>
              Replying to feedback from {selectedFeedback?.username} (
              {selectedFeedback?.email})
            </DialogDescription>
          </DialogHeader>

          {selectedFeedback && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">
                    {selectedFeedback.rating}/5
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedFeedback.message}
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="reply-message" className="text-sm font-medium">
                  Your Reply
                </label>
                <Textarea
                  id="reply-message"
                  placeholder="Type your reply here..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendReply}
              disabled={!replyMessage.trim()}
              className="bg-biniq-teal hover:bg-biniq-teal/90"
            >
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
            <DialogDescription>
              Complete information for {selectedFeedback?.username}'s feedback
            </DialogDescription>
          </DialogHeader>

          {selectedFeedback && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="h-5 w-5" />
                    Feedback Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Feedback ID:</span>{" "}
                      {selectedFeedback._id}
                    </div>
                    <div>
                      <span className="font-medium">Username:</span>{" "}
                      {selectedFeedback.username || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">User Type:</span>{" "}
                      <Badge
                        variant={
                          selectedFeedback.userType === "Store Owner"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {selectedFeedback.userType}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Rating:</span>{" "}
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">
                          {selectedFeedback.rating}/5
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Message:</span>{" "}
                      <p className="text-sm text-muted-foreground">
                        {selectedFeedback.message || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Email:</span>{" "}
                      {selectedFeedback.email || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Date:</span>{" "}
                      {selectedFeedback.date}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>{" "}
                      <Badge
                        variant={
                          selectedFeedback.replied ? "default" : "destructive"
                        }
                      >
                        {selectedFeedback.replied ? "Replied" : "Pending"}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Reply:</span>{" "}
                      {selectedFeedback.reply || "No reply yet"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
