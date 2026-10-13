import { getRepository } from '@/lib/repository';
import { Workspace } from '@/components/workspace';
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
 const params = await searchParams;
 const query = typeof params.q === 'string' ? params.q.trim().slice(0,100) : '';
 const repository = await getRepository();
 const [total, allTotal] = await Promise.all([repository.count(query), repository.count()]);
 const requestedPage = typeof params.page === 'string' && /^\d{1,5}$/.test(params.page) ? Number(params.page) : 1;
 const page = Math.min(Math.max(1,requestedPage),Math.max(1,Math.ceil(total/30)));
 const patients = await repository.list(query,(page-1)*30);
 if (!patients.length) return <main style={{padding:40}}><h1>No matching patients</h1><form action="/"><label>Search patients <input name="q" defaultValue={query} maxLength={100}/></label><button>Search</button></form><a href="/">Return to all {allTotal.toLocaleString('en')} profiles</a></main>;
 return <Workspace key={`${page}:${query}`} patients={patients} total={total} allTotal={allTotal} page={page} query={query} externalAllowed={repository.origin === 'self-authored'} />;
}
