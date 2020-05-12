---
title: JSON and the Headspring Labs Enumeration
date: "2013-11-25"
description: >-
  Exploring a library for a better way to do enumerations in .NET
---

We've started to bring in the Enumeration utility from Headspring Labs. Its an alternative to the .net enum that I've found does a nice job of enforcing correctness. You can get that bad boy on [Nuget](https://www.nuget.org/packages/enumeration) or [Github](https://github.com/HeadspringLabs/Enumeration)

The only real downside, for our use cases, is that it serializes both the display string and value. We serialize to JSON for our client and we use Raven as our read store. We simply wanted to send, and store, the enumeration value.

There are a couple of alternatives for doing this. We chose to wire in a custom JsonConverter in JSON.NET (and in Raven too, since Raven brings along its own bundled version of JSON.NET)

Here's what I came up with (formatting apologies). 

```csharp
public class EnumerationJsonConverter : JsonConverter
{
  public override bool CanConvert(Type objectType)
  {
      return IsEnumeration(objectType);
  }

  public bool IsEnumeration(Type type)
  {
    if (type == null || type.BaseType == null || !type.BaseType.IsGenericType)
    {
      return false;
    }

    var baseType = type.BaseType;
    if (baseType.GenericTypeArguments.Count() == 1)
    {
        return (type.BaseType == 
                typeof(Enumeration<>)
                .MakeGenericType(baseType.GenericTypeArguments.ToArray()));
    }
        return (type.BaseType == 
                typeof(Enumeration<,>)
                .MakeGenericType(baseType.GenericTypeArguments.ToArray()));
  }

  public override void WriteJson(JsonWriter writer, 
                                 object value, 
                                 JsonSerializer serializer)
  {
    var type = value.GetType();
    var enumValue = type.GetProperty("Value").GetValue(value);
	
    writer.WriteValue(enumValue);
  }

  public override object ReadJson(JsonReader reader, 
                                  Type objectType, 
                                  object existingValue, 
                                  JsonSerializer serializer)
  {
    var bindingFlags = BindingFlags.Static |
                       BindingFlags.FlattenHierarchy |
                       BindingFlags.Public;
					   
    var meth = objectType
                .GetMethod("FromValue", bindingFlags);
					
    var enumerable = meth
                     .Invoke(null, new[] { reader.Value });

    return enumerable;
  }
}
```