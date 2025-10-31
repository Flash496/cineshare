// frontend/components/watchlist/embed-code-dialog.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Code, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface EmbedCodeDialogProps {
  watchlistId: string;
}

export function EmbedCodeDialog({ watchlistId }: EmbedCodeDialogProps) {
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  
  const iframeCode = `<iframe src="${baseUrl}/embed/watchlist/${watchlistId}" width="100%" height="600" frameborder="0"></iframe>`;
  
  const scriptCode = `<script src="${baseUrl}/embed.js" data-watchlist="${watchlistId}"></script>`;

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Embed code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy. Please copy manually.');
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Code className="mr-2 h-4 w-4" />
          Embed
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Embed Watchlist</DialogTitle>
          <DialogDescription>
            Embed this watchlist on your website or blog
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="iframe" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="iframe">iFrame</TabsTrigger>
            <TabsTrigger value="script">JavaScript</TabsTrigger>
          </TabsList>

          <TabsContent value="iframe" className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Copy and paste this code into your HTML:
              </p>
              <div className="relative">
                <Textarea
                  value={iframeCode}
                  readOnly
                  className="font-mono text-sm h-32 pr-12"
                  onClick={(e) => e.currentTarget.select()}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() => copyCode(iframeCode)}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="script" className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Copy and paste this code into your HTML:
              </p>
              <div className="relative">
                <Textarea
                  value={scriptCode}
                  readOnly
                  className="font-mono text-sm h-32 pr-12"
                  onClick={(e) => e.currentTarget.select()}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() => copyCode(scriptCode)}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Preview */}
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium">Preview:</p>
          <div className="border rounded-lg p-4 bg-muted/50 min-h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">
              Embed preview would appear here
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}