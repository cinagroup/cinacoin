import { HealthCheck, ServiceDefinition } from "@/lib/services";
interface ServiceCardProps {
    service: ServiceDefinition;
    health: HealthCheck;
    demoMode?: boolean;
}
export default function ServiceCard({ service, health, demoMode }: ServiceCardProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ServiceCard.d.ts.map