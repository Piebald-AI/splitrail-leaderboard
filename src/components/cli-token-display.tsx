"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Code } from "@/components/ui/code";
import { Trash2, Eye, EyeOff, Copy, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ApiToken {
  id: string;
  token: string;
  name: string;
  lastUsed: string | null;
  createdAt: string;
}

export function CLITokenDisplay() {
  const { data: session } = useSession();
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [visibleTokens, setVisibleTokens] = useState<Set<string>>(new Set());
  const [copiedTokens, setCopiedTokens] = useState<Set<string>>(new Set());
  const [newTokenName, setNewTokenName] = useState("");
  const [creatingToken, setCreatingToken] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchTokens = useCallback(async () => {
    if (!session) return;

    setLoading(true);
    try {
      const response = await fetch("/api/user/token");
      const data = await response.json();

      if (data.success) {
        setTokens(data.data.tokens);
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to fetch tokens",
        });
      }
    } catch (error) {
      console.error("Error fetching tokens:", error);
      setMessage({ type: "error", text: "Failed to fetch tokens" });
    } finally {
      setLoading(false);
    }
  }, [session]);

  const createNewToken = async () => {
    if (!session) return;

    setCreatingToken(true);
    setMessage(null);
    try {
      const response = await fetch("/api/user/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newTokenName || undefined }),
      });
      const data = await response.json();

      if (data.success) {
        setTokens((prev) => [data.data.token, ...prev]);
        setVisibleTokens((prev) => new Set([...prev, data.data.token.id]));
        setNewTokenName("");
        setMessage({ type: "success", text: "Token created successfully!" });
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to create token",
        });
      }
    } catch (error) {
      console.error("Error creating token:", error);
      setMessage({ type: "error", text: "Failed to create token" });
    } finally {
      setCreatingToken(false);
    }
  };

  const deleteToken = async (tokenId: string) => {
    if (!session) return;

    try {
      const response = await fetch(`/api/user/token?tokenId=${tokenId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        setTokens((prev) => prev.filter((t) => t.id !== tokenId));
        setVisibleTokens((prev) => {
          const newSet = new Set(prev);
          newSet.delete(tokenId);
          return newSet;
        });
        setMessage({ type: "success", text: "Token deleted successfully!" });
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to delete token",
        });
      }
    } catch (error) {
      console.error("Error deleting token:", error);
      setMessage({ type: "error", text: "Failed to delete token" });
    }
  };

  const copyToken = async (token: string, tokenId: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(token);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = token;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopiedTokens((prev) => new Set([...prev, tokenId]));
      setTimeout(() => {
        setCopiedTokens((prev) => {
          const newSet = new Set(prev);
          newSet.delete(tokenId);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error("Failed to copy token:", error);
    }
  };

  const toggleTokenVisibility = (tokenId: string) => {
    setVisibleTokens((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tokenId)) {
        newSet.delete(tokenId);
      } else {
        newSet.add(tokenId);
      }
      return newSet;
    });
  };

  const maskToken = (token: string) => {
    if (token.length <= 4) return token;
    return "•".repeat(token.length - 4) + token.slice(-4);
  };

  useEffect(() => {
    if (session) {
      fetchTokens();
    } else {
      setLoading(false);
    }
  }, [session, fetchTokens]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!session) {
    return (
      <div className="space-y-4">
        <div className="text-center p-8 text-muted-foreground">
          Sign in to manage your API tokens for the Splitrail CLI.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert
          className={`${message.type === "success" ? "border-green-200 bg-green-50" : ""}`}
          variant={message.type === "success" ? undefined : "destructive"}
        >
          <AlertDescription
            className={message.type === "success" ? "text-green-800" : ""}
          >
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Create New Token */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Token name (optional)"
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              disabled={creatingToken}
            />
          </div>
          <Button
            onClick={createNewToken}
            disabled={creatingToken || tokens.length >= 50}
          >
            <Plus className="h-4 w-4 mr-2" />
            {creatingToken ? "Creating..." : "Create Token"}
          </Button>
        </div>

        {tokens.length >= 50 && (
          <p className="text-sm text-muted-foreground">
            Maximum of 50 tokens reached. Delete some tokens to create new ones.
          </p>
        )}

        <p className="text-sm text-muted-foreground">
          You have {tokens.length} of 50 maximum tokens.
        </p>
      </div>

      {/* Token List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-muted-foreground">Loading tokens...</div>
        </div>
      ) : tokens.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No tokens created yet. Create your first token above.
        </div>
      ) : (
        <div className="space-y-3">
          <Label className="text-base font-medium">Your API Tokens:</Label>

          {tokens.map((token) => {
            const isVisible = visibleTokens.has(token.id);
            const isCopied = copiedTokens.has(token.id);

            return (
              <Card key={token.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm">{token.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Created {new Date(token.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        value={isVisible ? token.token : maskToken(token.token)}
                        readOnly
                        className="flex-1 font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleTokenVisibility(token.id)}
                      >
                        {isVisible ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToken(token.token, token.id)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        {isCopied ? "Copied!" : "Copy"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteToken(token.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {token.lastUsed && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last used: {new Date(token.lastUsed).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Setup Instructions */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ol className="space-y-2 list-decimal list-inside text-sm">
            <li>Copy one of your API tokens above</li>
            <li>
              Configure Splitrail CLI with:{" "}
              <Code variant="inline">
                splitrail config set-token &lt;your-token&gt;
              </Code>
            </li>
            <li>
              Set server URL:{" "}
              <Code variant="inline">
                splitrail config set-server{" "}
                {typeof window !== "undefined" ? window.location.origin : ""}
              </Code>
            </li>
            <li>
              Run <Code variant="inline">splitrail upload</Code> to start
              tracking!
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
