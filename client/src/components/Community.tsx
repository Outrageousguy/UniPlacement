import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  MessageCircle,
  Users,
  Send,
  Search,
  Plus,
  Clock,
  ThumbsUp,
  Reply,
  MoreHorizontal,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Discussion {
  id: number;
  title: string;
  content: string;
  author: {
    name: string;
    branch: string;
  };
  createdAt: Date;
  repliesCount: number;
  likesCount: number;
  tags: string[];
}

interface StudentContact {
  id: number;
  name: string;
  branch: string;
  graduationYear: number;
  placementStatus: string;
  placedCompany?: string;
  isOnline: boolean;
}

interface Message {
  id: number;
  senderId: number;
  content: string;
  timestamp: Date;
  isOwn: boolean;
}

interface CommunityProps {
  discussions: Discussion[];
  students: StudentContact[];
  onCreateDiscussion: (title: string, content: string, tags: string[]) => void;
  onSendMessage: (studentId: number, message: string) => void;
  onLikeDiscussion: (discussionId: number) => void;
}

export default function Community({
  discussions,
  students,
  onCreateDiscussion,
  onSendMessage,
  onLikeDiscussion,
}: CommunityProps) {
  const [activeTab, setActiveTab] = useState("discussions");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentContact | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([
    { id: 1, senderId: 2, content: "Hey! How's your preparation going for the Google interview?", timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), isOwn: false },
    { id: 2, senderId: 1, content: "Going well! I've been practicing DSA problems daily. Any tips?", timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), isOwn: true },
    { id: 3, senderId: 2, content: "Focus on system design too. They asked me about distributed systems.", timestamp: new Date(Date.now() - 30 * 60 * 1000), isOwn: false },
  ]);

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.branch.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDiscussions = discussions.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCreateDiscussion = () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    onCreateDiscussion(newTitle, newContent, []);
    setShowNewDiscussion(false);
    setNewTitle("");
    setNewContent("");
    toast({
      title: "Discussion Created",
      description: "Your discussion has been posted",
    });
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedStudent) return;
    
    const newMessage: Message = {
      id: messages.length + 1,
      senderId: 1,
      content: messageInput,
      timestamp: new Date(),
      isOwn: true,
    };
    setMessages([...messages, newMessage]);
    onSendMessage(selectedStudent.id, messageInput);
    setMessageInput("");
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList>
            <TabsTrigger value="discussions" className="gap-2" data-testid="tab-discussions">
              <MessageCircle className="w-4 h-4" />
              Discussions
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-2" data-testid="tab-students">
              <Users className="w-4 h-4" />
              Students
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={activeTab === "discussions" ? "Search discussions..." : "Search students..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-community"
              />
            </div>
            {activeTab === "discussions" && (
              <Dialog open={showNewDiscussion} onOpenChange={setShowNewDiscussion}>
                <DialogTrigger asChild>
                  <Button data-testid="button-new-discussion">
                    <Plus className="w-4 h-4 mr-2" />
                    New Discussion
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Start a Discussion</DialogTitle>
                    <DialogDescription>
                      Share your thoughts, ask questions, or help others
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Input
                        placeholder="Discussion title..."
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        data-testid="input-discussion-title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Textarea
                        placeholder="What would you like to discuss?"
                        rows={5}
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        data-testid="input-discussion-content"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewDiscussion(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateDiscussion} data-testid="button-post-discussion">
                      Post Discussion
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <TabsContent value="discussions" className="mt-6">
          {filteredDiscussions.length === 0 ? (
            <Card className="p-12 text-center">
              <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="font-medium text-muted-foreground">No discussions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start a conversation with your peers
              </p>
              <Button className="mt-4" onClick={() => setShowNewDiscussion(true)}>
                Start First Discussion
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredDiscussions.map((discussion) => (
                <Card
                  key={discussion.id}
                  className="p-5 hover-elevate cursor-pointer transition-all"
                  data-testid={`discussion-${discussion.id}`}
                >
                  <div className="flex gap-4">
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarFallback className="text-xs bg-muted">
                        {getInitials(discussion.author.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium leading-tight">{discussion.title}</h3>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {discussion.author.name} · {discussion.author.branch}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {discussion.content}
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <button
                          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => onLikeDiscussion(discussion.id)}
                        >
                          <ThumbsUp className="w-4 h-4" />
                          {discussion.likesCount}
                        </button>
                        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                          <Reply className="w-4 h-4" />
                          {discussion.repliesCount} replies
                        </button>
                        {discussion.tags.length > 0 && (
                          <div className="flex gap-1.5 ml-auto">
                            {discussion.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="students" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Students</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[500px]">
                    {filteredStudents.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground">
                        No students found
                      </div>
                    ) : (
                      filteredStudents.map((student) => (
                        <div
                          key={student.id}
                          className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b last:border-b-0 ${
                            selectedStudent?.id === student.id ? "bg-muted/50" : ""
                          }`}
                          onClick={() => setSelectedStudent(student)}
                          data-testid={`student-contact-${student.id}`}
                        >
                          <div className="relative">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="text-xs bg-muted">
                                {getInitials(student.name)}
                              </AvatarFallback>
                            </Avatar>
                            {student.isOnline && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{student.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {student.branch} · {student.graduationYear}
                            </p>
                          </div>
                          {student.placementStatus === "Placed" && student.placedCompany && (
                            <Badge variant="secondary" className="text-xs flex-shrink-0">
                              {student.placedCompany}
                            </Badge>
                          )}
                        </div>
                      ))
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="h-[560px] flex flex-col">
                {selectedStudent ? (
                  <>
                    <CardHeader className="pb-3 border-b flex-shrink-0">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="text-xs bg-muted">
                            {getInitials(selectedStudent.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{selectedStudent.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {selectedStudent.branch} · Class of {selectedStudent.graduationYear}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                      <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[75%] rounded-lg px-4 py-2.5 ${
                                  message.isOwn
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                <p
                                  className={`text-xs mt-1 ${
                                    message.isOwn
                                      ? "text-primary-foreground/70"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {formatDistanceToNow(new Date(message.timestamp), {
                                    addSuffix: true,
                                  })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <div className="p-4 border-t flex-shrink-0">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Type a message..."
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                            data-testid="input-message"
                          />
                          <Button
                            size="icon"
                            onClick={handleSendMessage}
                            disabled={!messageInput.trim()}
                            data-testid="button-send-message"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center p-6">
                    <div>
                      <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="font-medium text-muted-foreground">
                        Select a student to chat
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Connect with your peers for interview tips and guidance
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
