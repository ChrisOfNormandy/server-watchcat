```
sudo nano /lib/systemd/system/watchcatbot.service
sudo nano /lib/systemd/system/watchcatpanel.service

sudo systemctl daemon-reload

sudo systemctl start watchcatpanel
sudo systemctl start watchcatbot

sudo firewall-cmd --zone=public --permanent --add-port=8000/tcp
sudo firewall-cmd --reload
```