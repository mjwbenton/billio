# billio

Digital shelves to track collections and interests

## Creating a User

```sh
$ aws cognito-idp admin-create-user --user-pool-id us-east-1_nIN7ZeVpN --username $USERNAME --profile mattb.tech-deploy
$ aws cognito-idp admin-set-user-password --user-pool-id us-east-1_nIN7ZeVpN --username $USERNAME --password $PASSWORD --permanent --profile mattb.tech-deploy
```
