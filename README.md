# **Allo Controllers** for Deno 🦕

Simple "convention over configuration" Controllers solution for Deno.

Extends the [**Allo Routing**](https://deno.land/x/allo_routing/mod.ts) framework with a **Controllers** layer.

# Controller

## Life Cycle
```mermaid
  flowchart TB
  A("contructor()") --> B("inject*()")
  B --> C("onStartup() && startup()")
  C --> D("action<'Action'>()")
  D --> E("beforeRender() && onRender()")
  E --> F("render<'View'>()")
  F --> G("afterRender()")
  G --> H("onShutdown() && shutdown()")

```


---


## Documentation 📖

Description of all classes and methods with **examples**
will found in the [documentation](https://doc.deno.land/https://deno.land/x/allo_controllers/mod.ts).


---

Check out other [ours packages 📦](https://deno.land/x?query=allo_)!