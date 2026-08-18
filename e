warning: in the working copy of 'firestore.rules', LF will be replaced by CRLF the next time Git touches it
[1mdiff --git a/firestore.rules b/firestore.rules[m
[1mindex 1d082d5..08ca714 100644[m
[1m--- a/firestore.rules[m
[1m+++ b/firestore.rules[m
[36m@@ -1,32 +1,22 @@[m
 rules_version = '2';[m
[31m-[m
 service cloud.firestore {[m
   match /databases/{database}/documents {[m
     function signedIn() {[m
       return request.auth != null;[m
     }[m
[31m-[m
     function approvedDevice() {[m
       return signedIn()[m
         && exists(/databases/$(database)/documents/approved_devices/$(request.auth.uid))[m
         && get(/databases/$(database)/documents/approved_devices/$(request.auth.uid)).data.approved == true;[m
     }[m
[31m-[m
[31m-    function canAddExpenses() {[m
[31m-      return approvedDevice()[m
[31m-        && get(/databases/$(database)/documents/approved_devices/$(request.auth.uid)).data.canAddExpenses == true;[m
[31m-    }[m
[31m-[m
     function validText(value, maximum) {[m
       return value is string[m
         && value.size() > 0[m
         && value.size() <= maximum;[m
     }[m
[31m-[m
     function validOptionalText(value, maximum) {[m
       return value is string && value.size() <= maximum;[m
     }[m
[31m-[m
     function validShoppingItem() {[m
       let data = request.resource.data;[m
       return data.keys().hasOnly([[m
[36m@@ -50,7 +40,6 @@[m [mservice cloud.firestore {[m
         && (!('lastQty' in data) || (data.lastQty is number && data.lastQty >= 1 && data.lastQty <= 999))[m
         && (!('lastUnitPrice' in data) || (data.lastUnitPrice is number && data.lastUnitPrice >= 0 && data.lastUnitPrice <= 99999.99));[m
     }[m
[31m-[m
     match /shopping_items/{itemId} {[m
       allow read: if approvedDevice();[m
       allow create: if approvedDevice() && validShoppingItem();[m
[36m@@ -62,7 +51,6 @@[m [mservice cloud.firestore {[m
         && validShoppingItem();[m
       allow delete: if approvedDevice();[m
     }[m
[31m-[m
     function validExpense() {[m
       let data = request.resource.data;[m
       return data.keys().hasOnly([[m
[36m@@ -75,8 +63,8 @@[m [mservice cloud.firestore {[m
         ])[m
         && validText(data.description, 80)[m
         && data.category in [[m
[31m-          'Dinner', 'Kids Dinner', 'Kids Toy', 'Petrol', 'Grocery', 'Kmart',[m
[31m-          'Gift', 'Other', "B'Day"[m
[32m+[m[32m          'Dinner', 'Kids Dinner', 'Kids Toy', 'Petrol', 'Grocery', 'Kmart', 'Gift',[m
[32m+[m[32m          'Other'[m
         ][m
         && data.amount is number[m
         && data.amount != 0[m
[36m@@ -91,20 +79,17 @@[m [mservice cloud.firestore {[m
           ? data.amount > 0 && !('amendsExpenseId' in data)[m
           : validText(data.amendsExpenseId, 128));[m
     }[m
[31m-[m
     match /expenses/{expenseId} {[m
       allow read: if approvedDevice();[m
[31m-      allow create: if canAddExpenses() && validExpense();[m
[32m+[m[32m      allow create: if approvedDevice() && validExpense();[m
       allow update, delete: if false;[m
     }[m
[31m-[m
     // Login needs to read the selected household user after anonymous auth.[m
     // User profiles cannot be changed from the app.[m
     match /families/{familyId}/users/{userId} {[m
       allow get: if signedIn();[m
       allow list, create, update, delete: if false;[m
     }[m
[31m-[m
     match /pending_devices/{uid} {[m
       allow get: if signedIn() && request.auth.uid == uid;[m
       allow list: if false;[m
[36m@@ -118,19 +103,16 @@[m [mservice cloud.firestore {[m
         && request.resource.data.requestedAt is timestamp;[m
       allow update, delete: if false;[m
     }[m
[31m-[m
     match /approved_devices/{uid} {[m
       allow get: if signedIn() && request.auth.uid == uid;[m
       allow list, create, update, delete: if false;[m
     }[m
[31m-[m
     // The removed notification feature cannot consume Firestore quota.[m
     match /notification_requests/{requestId} {[m
       allow read, write: if false;[m
     }[m
[31m-[m
     match /{document=**} {[m
       allow read, write: if false;[m
     }[m
   }[m
[31m-}[m
[32m+[m[32m}[m
\ No newline at end of file[m
