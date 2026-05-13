import React, { useState } from 'react';
import { Scan, Sparkles, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { geminiService } from '@/src/services/geminiService';
import { toast } from 'sonner';

export const InvoiceScanner: React.FC<{ onExtracted: (items: any[]) => void }> = ({ onExtracted }) => {
  const [scanning, setScanning] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    toast.info("AI is analyzing the invoice...");

    try {
      const result = await geminiService.scanInvoice(file);
      if (result && result.items) {
        onExtracted(result.items);
        toast.success(`Extracted ${result.items.length} items from invoice`);
      } else {
        toast.error("Could not extract readable data from this file.");
      }
    } catch (err) {
      toast.error("AI Vision service failed. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="relative">
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        id="invoice-upload"
        onChange={handleFileChange}
        disabled={scanning}
      />
      <label htmlFor="invoice-upload">
        <Button 
          type="button"
          variant="outline" 
          size="sm" 
          className="border-orange-500/50 text-orange-500 hover:bg-orange-500/10 cursor-pointer"
        >
          {scanning ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Scan className="w-4 h-4 mr-2" />
          )}
          {scanning ? "Processing..." : "Scan Invoice"}
          <Sparkles className="w-3 h-3 ml-1 text-orange-400" />
        </Button>
      </label>
    </div>
  );
};
