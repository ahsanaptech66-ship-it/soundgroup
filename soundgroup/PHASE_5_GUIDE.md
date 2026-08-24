# Phase 5 Test Guide

## 1. User media persistence
1. Log in as a normal user.
2. Upload one MP3 and one video from My Media.
3. Refresh repeatedly.
4. Confirm both remain in My Media.
5. Confirm Music shows only the user audio and Watch shows only the user video.
6. Log out to Guest and confirm none of those personal uploads appear.
7. Log back in as the same owner and confirm both return.

## 2. Admin account personal uploads
1. Log in as an admin.
2. Upload one audio and one video from My Media.
3. Refresh/reload.
4. Confirm both remain in that admin's Music/Watch/My Media.
5. Confirm they are not in Discover.
6. Log out and check Guest: the personal files must not appear in Music/Watch or Discover.

## 3. Admin monitoring
1. Log in to `/admin/`.
2. Open User Monitoring.
3. Confirm user-origin uploads from all accounts are visible there.
4. Search by title, filename, user name, or email.
5. Filter Music/Videos and sort.
6. Open a file.
7. Delete one user upload and confirm it disappears from the owner library after login.
8. Select multiple uploads and use Delete selected.

## 4. Official content regression
1. Upload/publish one audio and one video through Admin Music/Videos.
2. Confirm both appear in Discover.
3. Confirm they do not appear in personal Music/Watch.
4. Confirm Guest/normal users can see only the official Discover versions.
