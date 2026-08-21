import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { copyToClipboard, whatsappUrl } from "@/lib/whatsapp";

export interface WhatsappSharePayload {
  phone: string;
  message: string;
  title?: string;
}

export function WhatsappShareDialog({
  payload,
  onOpenChange,
}: {
  payload: WhatsappSharePayload | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (payload) {
      setPhone(payload.phone);
      setMessage(payload.message);
      setCopied(false);
    }
  }, [payload]);

  const handleCopy = async () => {
    const ok = await copyToClipboard(message);
    if (ok) {
      setCopied(true);
      toast.success("Message copié");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Copie impossible sur cet appareil");
    }
  };

  const handleSend = () => {
    window.open(whatsappUrl(phone, message), "_blank", "noopener");
    onOpenChange(false);
  };

  return (
    <Dialog open={!!payload} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{payload?.title ?? "Envoyer sur WhatsApp"}</DialogTitle>
          <DialogDescription>
            Vérifiez le numéro et le message, puis ouvrez WhatsApp. Pensez à joindre le PDF téléchargé.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Numéro WhatsApp</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex. 221771234567"
              inputMode="tel"
            />
            {!phone.trim() && (
              <p className="mt-1 text-xs text-muted-foreground">
                Sans numéro, WhatsApp vous laissera choisir le destinataire.
              </p>
            )}
          </div>
          <div>
            <Label className="text-xs">Message</Label>
            <Textarea rows={7} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleCopy}>
            {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
            Copier le message
          </Button>
          <Button onClick={handleSend}>
            <MessageCircle className="mr-1 h-4 w-4" /> Ouvrir WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
