/**
 * SOP / how-to job tags — role labels for sorting (everyone sees all guides).
 */
(function (global) {
  'use strict';

  var ALL = 'all';

  function jobOptions() {
    return Array.isArray(global.ITERUM_TEAM_MEMBER_ROLE_OPTIONS)
      ? global.ITERUM_TEAM_MEMBER_ROLE_OPTIONS
      : [];
  }

  function validJobKeys() {
    var keys = jobOptions().map(function (o) {
      return o.value;
    });
    keys.push(ALL);
    return keys;
  }

  function normalizeJobTags(raw) {
    if (!Array.isArray(raw) || !raw.length) {
      return [ALL];
    }
    var valid = new Set(validJobKeys());
    var tags = raw
      .map(function (t) {
        return String(t || '').trim();
      })
      .filter(function (t) {
        return t && valid.has(t);
      });
    if (!tags.length) {
      return [ALL];
    }
    if (tags.indexOf(ALL) >= 0) {
      return [ALL];
    }
    return tags;
  }

  function jobTagLabel(key) {
    if (!key || key === ALL) {
      return 'All roles';
    }
    var opt = jobOptions().find(function (o) {
      return o.value === key;
    });
    return opt ? opt.label : key;
  }

  function formatJobTagsSummary(tags) {
    var normalized = normalizeJobTags(tags);
    if (normalized.length === 1 && normalized[0] === ALL) {
      return 'All roles';
    }
    return normalized
      .filter(function (t) {
        return t !== ALL;
      })
      .map(jobTagLabel)
      .join(', ');
  }

  function sopRelevanceScore(sop, positionKey) {
    var tags = normalizeJobTags(sop && sop.jobTags);
    if (!positionKey || positionKey === ALL) {
      return 0;
    }
    if (tags.indexOf(ALL) >= 0) {
      return 1;
    }
    if (tags.indexOf(positionKey) >= 0) {
      return 2;
    }
    return 0;
  }

  function sortSopsByJob(sops, positionKey) {
    return (Array.isArray(sops) ? sops : []).slice().sort(function (a, b) {
      var sa = sopRelevanceScore(a, positionKey);
      var sb = sopRelevanceScore(b, positionKey);
      if (sb !== sa) {
        return sb - sa;
      }
      return (a.sort || 0) - (b.sort || 0);
    });
  }

  function resolveFromProfile() {
    var m = global.iterumMembership;
    if (m && m.role) {
      return m.role;
    }
    if (m && m.roleKey) {
      return m.roleKey;
    }
    var p =
      typeof global.getOperatorProfile === 'function'
        ? global.getOperatorProfile()
        : null;
    return (p && p.roleKey) || ALL;
  }

  async function getDefaultPositionKey(db, uid, projectId) {
    if (db && uid && projectId) {
      try {
        var fs = await import(
          'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'
        );
        var prefSnap = await fs.getDoc(
          fs.doc(db, 'users', uid, 'workspace_prefs', projectId)
        );
        if (prefSnap.exists()) {
          var pref = prefSnap.data() || {};
          if (pref.positionKey) {
            return String(pref.positionKey);
          }
        }
        var memSnap = await fs.getDoc(
          fs.doc(db, 'projects', projectId, 'members', uid)
        );
        if (memSnap.exists()) {
          var mem = memSnap.data() || {};
          if (mem.role) {
            return String(mem.role);
          }
        }
      } catch (e) {
        console.warn('sop-job-tags: position lookup failed', e);
      }
    }
    return resolveFromProfile();
  }

  function renderJobTagCheckboxes(host, selectedTags) {
    if (!host) {
      return;
    }
    var selected = new Set(normalizeJobTags(selectedTags));
    var allChecked = selected.has(ALL);
    var html =
      '<div class="sop-job-tag-grid" role="group" aria-label="Job tags for this guide">' +
      '<label class="sop-job-tag-option">' +
      '<input type="checkbox" name="sop-job-tag" value="' +
      ALL +
      '"' +
      (allChecked ? ' checked' : '') +
      '> All roles</label>';

    jobOptions().forEach(function (opt) {
      html +=
        '<label class="sop-job-tag-option">' +
        '<input type="checkbox" name="sop-job-tag" value="' +
        opt.value +
        '"' +
        (!allChecked && selected.has(opt.value) ? ' checked' : '') +
        '> ' +
        opt.label +
        '</label>';
    });
    html += '</div>';
    host.innerHTML = html;

    host
      .querySelectorAll('input[name="sop-job-tag"]')
      .forEach(function (input) {
        input.addEventListener('change', function () {
          if (input.value === ALL && input.checked) {
            host
              .querySelectorAll('input[name="sop-job-tag"]')
              .forEach(function (el) {
                if (el.value !== ALL) {
                  el.checked = false;
                }
              });
            return;
          }
          if (input.value !== ALL && input.checked) {
            var allBox = host.querySelector('input[value="' + ALL + '"]');
            if (allBox) {
              allBox.checked = false;
            }
          }
          var anyRole = host.querySelector(
            'input[name="sop-job-tag"]:checked:not([value="' + ALL + '"])'
          );
          if (!anyRole) {
            var all = host.querySelector('input[value="' + ALL + '"]');
            if (all) {
              all.checked = true;
            }
          }
        });
      });
  }

  function readJobTagCheckboxes(host) {
    if (!host) {
      return [ALL];
    }
    var allBox = host.querySelector('input[value="' + ALL + '"]');
    if (allBox && allBox.checked) {
      return [ALL];
    }
    var tags = [];
    host
      .querySelectorAll('input[name="sop-job-tag"]:checked')
      .forEach(function (el) {
        if (el.value && el.value !== ALL) {
          tags.push(el.value);
        }
      });
    return tags.length ? tags : [ALL];
  }

  function buildJobFilterOptions(positionKey) {
    var opts = [
      { value: 'all', label: 'All guides' },
      {
        value: 'my',
        label:
          positionKey && positionKey !== ALL
            ? 'My job — ' + jobTagLabel(positionKey)
            : 'My job'
      }
    ];
    jobOptions().forEach(function (o) {
      opts.push({ value: o.value, label: o.label });
    });
    return opts;
  }

  function resolveSortKey(filterValue, positionKey) {
    if (!filterValue || filterValue === 'all') {
      return ALL;
    }
    if (filterValue === 'my') {
      return positionKey || ALL;
    }
    return filterValue;
  }

  global.iterumSopJobTags = {
    ALL: ALL,
    jobOptions: jobOptions,
    normalizeJobTags: normalizeJobTags,
    jobTagLabel: jobTagLabel,
    formatJobTagsSummary: formatJobTagsSummary,
    sopRelevanceScore: sopRelevanceScore,
    sortSopsByJob: sortSopsByJob,
    getDefaultPositionKey: getDefaultPositionKey,
    resolveFromProfile: resolveFromProfile,
    renderJobTagCheckboxes: renderJobTagCheckboxes,
    readJobTagCheckboxes: readJobTagCheckboxes,
    buildJobFilterOptions: buildJobFilterOptions,
    resolveSortKey: resolveSortKey
  };
})(typeof window !== 'undefined' ? window : globalThis);
