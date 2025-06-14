// src/components/NotFoundPage.tsx
import { Link } from "wouter";
import { Button } from "./ui/button";

export default function NotFoundPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <h1 className="text-9xl font-bold text-blue-600">404</h1>
            <h2 className="text-2xl font-semibold mt-4 mb-2">Página Não Encontrada</h2>
            <p className="text-gray-500 mb-6">A página que você está procurando não existe ou foi movida.</p>
            <Link href="/dashboard">
                <Button>Voltar ao Início</Button>
            </Link>
        </div>
    );
}