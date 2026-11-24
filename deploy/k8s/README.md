# Petstore trên Kubernetes (Helm)

> **Chưa chạy trên cụm thật.** Chart mới qua `helm lint` và `helm template | kubeconform -strict` (k8s 1.30).
> Chưa có ai apply, probe path, env var Spring và realm Keycloak chưa kiểm chứng với image thật.

Chart: `chart/petstore` — app (Spring Boot :8081), web (nginx :80), Postgres (StatefulSet đơn, dùng cho demo),
Keycloak (realm import từ ConfigMap, placeholder), Ingress, HPA cho app, NetworkPolicy cơ bản.

## Yêu cầu cụm
Ingress controller (mặc định `nginx`, namespace `ingress-nginx`), cert-manager với ClusterIssuer `letsencrypt-prod`,
metrics-server (cho HPA), CNI hỗ trợ NetworkPolicy, StorageClass mặc định.
App cần bật `management.endpoint.health.probes.enabled` (chart đã set qua env) và đọc cấu hình DB/issuer từ env
`SPRING_DATASOURCE_*`, `SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI`.

## Cài
```sh
kubectl create namespace petstore
# Secret tự tạo, không commit giá trị thật. Keys bắt buộc:
kubectl -n petstore create secret generic petstore-secrets \
  --from-literal=postgres-password='<đổi>' \
  --from-literal=keycloak-admin-password='<đổi>' \
  --from-literal=mail-password='<đổi>'

helm lint chart/petstore -f chart/petstore/values-demo.yaml
helm upgrade --install petstore chart/petstore -n petstore -f chart/petstore/values-demo.yaml \
  --set app.image.tag=<tag> --set web.image.tag=<tag>
```
Cụm khác: copy `values-demo.yaml` thành `values-<env>.yaml`, đổi `ingress.webHost`, `ingress.authHost`,
`ingress.className`, `ingress.annotations`, `networkPolicy.ingressControllerNamespace`, `existingSecret`.
Image: `ghcr.io/nqcdan/petstore-api`, `ghcr.io/nqcdan/petstore-web` (private thì thêm imagePullSecret vào namespace).

## Kiểm tra không cần cụm
```sh
helm template ps chart/petstore -f chart/petstore/values-demo.yaml | kubeconform -strict -summary
```

## Còn thiếu
Realm Keycloak thật (hiện chỉ client `petstore-web` mẫu), backup Postgres, egress NetworkPolicy, PodDisruptionBudget.
