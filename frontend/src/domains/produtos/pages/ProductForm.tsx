
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export const productSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres"),
  preco: z.number().min(0, "Preço deve ser maior ou igual a zero"),
  categoriaId: z.number().min(1, "Categoria é obrigatória"),
  descricao: z.string().max(500, "Descrição deve ter no máximo 500 caracteres").optional().nullable(),
  disponivel: z.boolean().default(true),
});

export type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  onSubmit: (values: ProductFormValues) => void;
  isSubmitting: boolean;
  defaultValues?: any;
  categorias: Array<{ id: number; nome: string }>;
}

export function ProductForm({ onSubmit, isSubmitting, defaultValues, categorias }: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      nome: "",
      preco: 0,
      categoriaId: 0,
      descricao: "",
      disponivel: true,
    },
  });

  // Update form when defaultValues change (for editing)
  useEffect(() => {
    if (defaultValues) {
      form.reset({
        nome: defaultValues.nome || "",
        preco: Number(defaultValues.preco) || 0,
        categoriaId: defaultValues.categoriaId || 0,
        descricao: defaultValues.descricao || "",
        disponivel: defaultValues.disponivel !== false,
      });
    }
  }, [defaultValues, form]);

  const handleSubmit = (values: ProductFormValues) => {
    onSubmit(values);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="nome">Nome do Produto *</Label>
        <Input
          id="nome"
          {...form.register("nome")}
          placeholder="Ex: Hambúrguer Artesanal"
          disabled={isSubmitting}
        />
        {form.formState.errors.nome && (
          <p className="text-sm text-red-500 mt-1">{form.formState.errors.nome.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="preco">Preço *</Label>
          <Input
            id="preco"
            type="number"
            step="0.01"
            min="0"
            {...form.register("preco", { valueAsNumber: true })}
            placeholder="0.00"
            disabled={isSubmitting}
          />
          {form.formState.errors.preco && (
            <p className="text-sm text-red-500 mt-1">{form.formState.errors.preco.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="categoria">Categoria *</Label>
          <Select
            value={form.watch("categoriaId")?.toString() || ""}
            onValueChange={(value) => form.setValue("categoriaId", parseInt(value))}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar categoria" />
            </SelectTrigger>
            <SelectContent>
              {categorias.map((categoria) => (
                <SelectItem key={categoria.id} value={categoria.id.toString()}>
                  {categoria.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.categoriaId && (
            <p className="text-sm text-red-500 mt-1">{form.formState.errors.categoriaId.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          {...form.register("descricao")}
          placeholder="Descrição detalhada do produto (opcional)"
          disabled={isSubmitting}
          rows={3}
        />
        {form.formState.errors.descricao && (
          <p className="text-sm text-red-500 mt-1">{form.formState.errors.descricao.message}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="disponivel"
          checked={form.watch("disponivel")}
          onCheckedChange={(checked) => form.setValue("disponivel", checked)}
          disabled={isSubmitting}
        />
        <Label htmlFor="disponivel">Produto disponível</Label>
      </div>

      <div className="flex space-x-2 pt-4">
        <Button
          type="submit"
          className="flex-1"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            defaultValues ? "Atualizar Produto" : "Criar Produto"
          )}
        </Button>
      </div>
    </form>
  );
}
