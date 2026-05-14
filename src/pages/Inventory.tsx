import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  History, 
  Download,
  AlertCircle,
  Package,
  Scan,
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import Papa from 'papaparse';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { collection, onSnapshot, query, addDoc, serverTimestamp, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { InventoryProduct } from '@/src/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { InvoiceScanner } from '@/src/components/InvoiceScanner';
import { useAuth } from '@/src/context/AuthContext';

export const Inventory: React.FC = () => {
  const { profile, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);

  const handleExtracted = (items: any[]) => {
    if (items && items.length > 0) {
      setExtractedData(items[0]); // For now, just take the first item to pre-fill
      toast.success(`Extracted ${items.length} items from scan`);
    }
  };

  useEffect(() => {
    if (authLoading || !profile) return;

    const path = 'products';
    const q = query(collection(db, path));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryProduct));
      setProducts(pData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return unsubscribe;
  }, [profile, authLoading]);

  if (authLoading) return <div className="p-8 text-white">Loading Auth...</div>;

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      const path = `products/${id}`;
      try {
        await deleteDoc(doc(db, 'products', id));
        toast.success('Product deleted successfully');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
        toast.error('Failed to delete product');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Inventory Management</h2>
          <p className="text-sm text-slate-400">Manage products, brands and stock levels across godowns.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-800 text-slate-300">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <BulkImportDialog />
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<div className={cn(buttonVariants({ variant: "default" }), "bg-orange-600 hover:bg-orange-700 text-white cursor-pointer inline-flex items-center justify-center")}>
                <Plus className="w-4 h-4 mr-2" /> Add Product
              </div>} />
            <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="flex justify-between items-center">
                  Add New Product
                  <InvoiceScanner onExtracted={handleExtracted} />
                </DialogTitle>
              </DialogHeader>
              <AddProductForm 
                onSuccess={() => {
                  setIsAddOpen(false);
                  setExtractedData(null);
                }} 
                initialData={extractedData}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Search by name, brand, or SKU..." 
            className="pl-10 bg-slate-950 border-slate-800 text-slate-200 focus:border-orange-500/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="border-slate-800 text-slate-300">
          <Filter className="w-4 h-4 mr-2" /> Filters
        </Button>
      </div>

      {/* Inventory Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-slate-900/50">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Product</TableHead>
              <TableHead className="text-slate-400">Brand</TableHead>
              <TableHead className="text-slate-400">SKU/Model</TableHead>
              <TableHead className="text-slate-400 text-right">Quantity</TableHead>
              <TableHead className="text-slate-400 text-right">Price</TableHead>
              <TableHead className="text-slate-400 text-center">Status</TableHead>
              <TableHead className="text-slate-400"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id} className="border-slate-800 hover:bg-slate-900/30 transition-colors">
                <TableCell className="font-medium text-slate-200">
                  <div>
                    {product.name}
                    {product.quantity <= product.minStockLevel && (
                      <Badge variant="destructive" className="ml-2 scale-75 h-4 px-1">LOW</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-slate-400 capitalize">{product.brand}</TableCell>
                <TableCell className="text-slate-400">
                  <div className="flex flex-col">
                    <span className="text-xs">{product.sku}</span>
                    <span className="text-[10px] text-slate-600">{product.model}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className={cn(
                    "font-bold",
                    product.quantity <= product.minStockLevel ? "text-red-400" : "text-green-400"
                  )}>
                    {product.quantity}
                  </span>
                </TableCell>
                <TableCell className="text-right text-slate-300">
                  ${product.sellingPrice.toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  <Badge className={cn(
                    "bg-opacity-10",
                    product.status === 'in-stock' ? "bg-green-500 text-green-500 border-green-500/20" : "bg-red-500 text-red-500 border-red-500/20"
                  )}>
                    {product.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                  <DropdownMenuTrigger render={<div className={cn(buttonVariants({ variant: "ghost" }), "h-8 w-8 p-0 text-slate-500 hover:text-white cursor-pointer inline-flex items-center justify-center")}>
                        <MoreVertical className="h-4 w-4" />
                      </div>} />
                    <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-300">
                      <DropdownMenuItem className="focus:bg-slate-800 focus:text-white">
                        <Edit className="w-4 h-4 mr-2" /> Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem className="focus:bg-slate-800 focus:text-white">
                        <History className="w-4 h-4 mr-2" /> Stock History
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="focus:bg-red-950 focus:text-red-400 text-red-400"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredProducts.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <Package className="w-12 h-12 text-slate-800 mx-auto" />
            <h3 className="text-lg font-medium text-slate-400">No products found</h3>
            <p className="text-sm text-slate-600">Try adjusting your search or add a new product.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const BulkImportDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  useEffect(() => {
    const fetchWarehouses = async () => {
      const snap = await getDocs(collection(db, 'warehouses'));
      setWarehouses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    if (isOpen) fetchWarehouses();
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast.error('Please upload a valid CSV file');
        return;
      }
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data;
        const parseErrors: string[] = [];
        
        // Basic validation
        const validatedData = data.map((row: any, index) => {
          const rowNum = index + 2; // +1 for header, +1 for 1-based index
          if (!row.name) parseErrors.push(`Row ${rowNum}: Name is required`);
          if (!row.sku) parseErrors.push(`Row ${rowNum}: SKU is required`);
          
          return {
            name: row.name || '',
            brand: row.brand || '',
            model: row.model || '',
            sku: row.sku || '',
            quantity: parseInt(row.quantity) || 0,
            purchasePrice: parseFloat(row.purchasePrice) || 0,
            sellingPrice: parseFloat(row.sellingPrice) || 0,
            minStockLevel: parseInt(row.minStockLevel) || 5,
            category: row.category || 'Mobile',
            warehouseId: row.warehouseId || '',
            rackLocation: row.rackLocation || 'A1'
          };
        });

        setPreview(validatedData);
        setErrors(parseErrors);
      },
      error: (error) => {
        toast.error(`Error parsing CSV: ${error.message}`);
      }
    });
  };

  const handleImport = async () => {
    if (preview.length === 0) return;
    if (errors.length > 0) {
      toast.error('Please fix errors before importing');
      return;
    }

    setIsImporting(true);
    const batch = writeBatch(db);
    const productsRef = collection(db, 'products');

    try {
      // Check if warehouseIds exist if provided
      const validWarehouseIds = warehouses.map(w => w.id);
      
      preview.forEach((item) => {
        // If warehouseId is missing or invalid, assign to first available or leave empty
        const finalWarehouseId = validWarehouseIds.includes(item.warehouseId) 
          ? item.warehouseId 
          : (validWarehouseIds.length > 0 ? validWarehouseIds[0] : '');

        const newDocRef = doc(productsRef);
        batch.set(newDocRef, {
          ...item,
          warehouseId: finalWarehouseId,
          status: item.quantity > 0 ? 'in-stock' : 'out-of-stock',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
      toast.success(`Successfully imported ${preview.length} products`);
      setIsOpen(false);
      setFile(null);
      setPreview([]);
    } catch (error) {
      console.error('Import Error:', error);
      toast.error('Failed to import products');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={<div className={cn(buttonVariants({ variant: "outline" }), "border-slate-800 text-slate-300 inline-flex items-center justify-center cursor-pointer")}>
          <Upload className="w-4 h-4 mr-2" /> Bulk Import
        </div>} />
      <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[700px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Product Import</DialogTitle>
          <DialogDescription className="text-slate-400">
            Upload a CSV file to import multiple products at once. Required columns: name, sku.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
          {!file ? (
            <div 
              className="border-2 border-dashed border-slate-800 rounded-xl p-10 text-center space-y-4 hover:border-orange-500/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById('csv-upload')?.click()}
            >
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Click to upload CSV file</p>
                <p className="text-xs text-slate-500 mt-1">or drag and drop here</p>
              </div>
              <input 
                id="csv-upload" 
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-orange-500" />
                  <div className="text-left">
                    <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {setFile(null); setPreview([]); setErrors([]);}}
                  className="text-slate-500 hover:text-red-400"
                >
                  Change File
                </Button>
              </div>

              {errors.length > 0 && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-red-400 text-sm font-bold">
                    <XCircle className="w-4 h-4" /> Errors Found
                  </div>
                  <ul className="text-xs text-red-400/80 list-disc pl-4 space-y-1">
                    {errors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
                    {errors.length > 5 && <li>...and {errors.length - 5} more errors</li>}
                  </ul>
                </div>
              )}

              {preview.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Preview ({preview.length} items)</p>
                  <div className="border border-slate-800 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-950">
                        <TableRow className="border-slate-800">
                          <TableHead className="h-8 text-[10px]">Name</TableHead>
                          <TableHead className="h-8 text-[10px]">SKU</TableHead>
                          <TableHead className="h-8 text-[10px] text-right">Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {preview.slice(0, 5).map((row, i) => (
                          <TableRow key={i} className="border-slate-800 bg-slate-900/50">
                            <TableCell className="py-2 text-[11px] truncate max-w-[120px]">{row.name}</TableCell>
                            <TableCell className="py-2 text-[11px]">{row.sku}</TableCell>
                            <TableCell className="py-2 text-[11px] text-right">${row.sellingPrice}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {preview.length > 5 && (
                      <div className="p-2 text-center text-[10px] text-slate-500 bg-slate-950 border-t border-slate-800">
                        + {preview.length - 5} more items
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-slate-800 pt-4">
          <Button variant="ghost" onClick={() => setIsOpen(false)} className="text-slate-400">Cancel</Button>
          <Button 
            disabled={!file || errors.length > 0 || isImporting}
            onClick={handleImport}
            className="bg-orange-600 hover:bg-orange-700 text-white min-w-[120px]"
          >
            {isImporting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            {isImporting ? 'Importing...' : 'Start Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AddProductForm = ({ onSuccess, initialData }: { onSuccess: () => void, initialData?: any }) => {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    brand: initialData?.brand || '',
    model: initialData?.model || '',
    sku: initialData?.sku || '',
    quantity: initialData?.quantity || 0,
    minStockLevel: 5,
    purchasePrice: initialData?.price || 0,
    sellingPrice: initialData?.price ? initialData.price * 1.2 : 0, 
    category: 'Mobile',
    warehouseId: '',
    rackLocation: 'A1'
  });

  useEffect(() => {
    const fetchWarehouses = async () => {
      const snap = await getDocs(collection(db, 'warehouses'));
      const ws = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWarehouses(ws);
      if (ws.length > 0 && !formData.warehouseId) {
        setFormData(prev => ({ ...prev, warehouseId: ws[0].id }));
      }
    };
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        sellingPrice: initialData.price ? initialData.price * 1.2 : prev.sellingPrice
      }));
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.warehouseId) {
      toast.error("Please select or create a Godown first");
      return;
    }
    const path = 'products';
    try {
      await addDoc(collection(db, path), {
        ...formData,
        status: formData.quantity > 0 ? 'in-stock' : 'out-of-stock',
        updatedAt: new Date().toISOString()
      });
      toast.success('Product added to inventory');
      onSuccess();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      toast.error('Failed to add product');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-400">Product Name</label>
          <Input 
            required 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="bg-slate-950 border-slate-800"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-400">Brand</label>
          <Input 
            required 
            value={formData.brand} 
            onChange={e => setFormData({...formData, brand: e.target.value})}
            className="bg-slate-950 border-slate-800"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-400">SKU / Code</label>
          <Input 
            required 
            value={formData.sku} 
            onChange={e => setFormData({...formData, sku: e.target.value})}
            className="bg-slate-950 border-slate-800"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-400">Model</label>
          <Input 
            required 
            value={formData.model} 
            onChange={e => setFormData({...formData, model: e.target.value})}
            className="bg-slate-950 border-slate-800"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-400">Assign to Godown</label>
        <select 
          required
          value={formData.warehouseId}
          onChange={e => setFormData({...formData, warehouseId: e.target.value})}
          className="w-full h-10 rounded-md bg-slate-950 border border-slate-800 text-sm px-3 text-slate-200"
        >
          <option value="" disabled>Select a Warehouse</option>
          {warehouses.map(w => (
            <option key={w.id} value={w.id}>{w.name} ({w.location})</option>
          ))}
          {warehouses.length === 0 && <option value="" disabled>No Warehouses Found - Create one first</option>}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-400">Quantity</label>
          <Input 
            type="number" 
            required 
            value={formData.quantity} 
            onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})}
            className="bg-slate-950 border-slate-800"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-400">Purchase Price</label>
          <Input 
            type="number" 
            required 
            value={formData.purchasePrice} 
            onChange={e => setFormData({...formData, purchasePrice: parseFloat(e.target.value)})}
            className="bg-slate-950 border-slate-800"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-400">Selling Price</label>
          <Input 
            type="number" 
            required 
            value={formData.sellingPrice} 
            onChange={e => setFormData({...formData, sellingPrice: parseFloat(e.target.value)})}
            className="bg-slate-950 border-slate-800"
          />
        </div>
      </div>
      <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">Save Product</Button>
    </form>
  );
};

/** helper removed as we use lib/utils */
