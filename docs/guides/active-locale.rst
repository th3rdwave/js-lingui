*************
Active locale
*************

Locale-specific URLs
====================

Each locale version has it's own unique URL. This is desired for static
pages or when content might be completely different depending on locale. Good example is Wikipedia where
pages aren't just translated, but the content may vary in different languages. Unique URLs are
also required for `search engines <google-multilingual-sites>`_.

Locale-adaptive pages
=====================

UI is localized based on user's preferences. Locale is detected
from HTTP header and can be overriden in cookie or local storage. This is desired for pages which serve
the same content but UI might be adapted to user's locale. Good example would be Github or Twitter.

Hybrid approach
===============

In some cases it's desired to use both approaches. For example, having
a locale-adaptive app like Twitter, you still want to serve landing page
from unique URL for search engines. Users always see just `example.com`
and the locale is detected from HTTP headers or user's settings. Crawlers
visits `example.com?l=en` and `example.com?l=fr` from hreflang_ annotations.

.. _google-multilingual-sites:: https://support.google.com/webmasters/answer/182192?hl=en&ref_topic=2370587
.. _hreflang:: https://support.google.com/webmasters/answer/189077
