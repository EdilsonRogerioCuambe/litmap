import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
    // Better Auth armazena a sessão num cookie chamado better-auth.session_token (ou similar dependendo do prefixo)
    // No localhost, costuma ser "better-auth.session_token"
    const sessionCookie = request.cookies.get("better-auth.session_token") || 
                          request.cookies.get("__Secure-better-auth.session_token");

    const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                       request.nextUrl.pathname.startsWith('/register');
    
    const isProtectedPage = request.nextUrl.pathname.startsWith('/projects') || 
                            request.nextUrl.pathname.startsWith('/onboarding');

    // Se estiver logado (existe cookie) e tentar ir para login/register, manda para projetos
    if (sessionCookie && isAuthPage) {
        return NextResponse.redirect(new URL('/projects', request.url));
    }

    // Se NÃO estiver logado (não existe cookie) e tentar ir para páginas protegidas, manda para login
    if (!sessionCookie && isProtectedPage) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
